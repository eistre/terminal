import type { ErrorCode, Status } from '#shared/protocol';
import type { Evaluator } from '@terminal/evaluator';
import type { Session } from '@terminal/session';
import { decode, encode } from '#shared/protocol';
import { TopicNotFoundError } from '@terminal/database';
import { createEvaluator } from '@terminal/evaluator';
import { createSession } from '@terminal/session';
import { useAuth } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useLogger } from '~~/server/lib/logger';
import { useProvisioner } from '~~/server/lib/provisioner';

interface TerminalContext {
  clientId: string;
  session?: Session;
  evaluator?: Evaluator;
  status: Status;
  lastExpirationUpdateAt: number;
}

const EXPIRATION_UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const auth = useAuth();
const database = useDatabase();
const provisioner = useProvisioner();
const baseLogger = useLogger().child({ caller: 'socket' });

function shellQuotePosix(value: string): string {
  return `'${value.split('\'').join(`'"'"'`)}'`;
}

function parseQueryParams(requestUrl: string): { rows: number | undefined; cols: number | undefined; slug: string | undefined } {
  const url = new URL(requestUrl, 'http://localhost');

  const rawRows = url.searchParams.get('rows');
  const rawCols = url.searchParams.get('cols');

  const rows = Number.parseInt(rawRows ?? '0', 10);
  const cols = Number.parseInt(rawCols ?? '0', 10);

  const slug = url.searchParams.get('slug') ?? undefined;

  return {
    rows: Number.isFinite(rows) && rows > 0 ? rows : undefined,
    cols: Number.isFinite(cols) && cols > 0 ? cols : undefined,
    slug,
  };
}

export default defineWebSocketHandler({
  async open(peer) {
    // Auth phase
    const userSession = await auth.api.getSession({ headers: peer.request.headers });
    if (!userSession) {
      baseLogger.warn({ ip: peer.remoteAddress }, 'Unauthorized websocket connection attempt');
      peer.send(encode({
        type: 'terminal/status',
        status: 'ERROR',
        code: 'UNAUTHORIZED',
        message: 'You must be signed in to use the terminal',
      }));

      return peer.close(1008, 'Unauthorized');
    }

    const clientId = userSession.user.id;
    const ctx: TerminalContext = {
      clientId,
      session: undefined,
      evaluator: undefined,
      status: 'PROVISIONING',
      lastExpirationUpdateAt: Date.now(),
    };

    const { rows, cols, slug } = parseQueryParams(peer.request.url);
    if (!slug) {
      ctx.status = 'ERROR';
      peer.send(encode({
        type: 'terminal/status',
        status: 'ERROR',
        code: 'INTERNAL_ERROR',
        message: 'Missing topic slug',
      }));

      return peer.close(1002, 'Missing topic slug');
    }

    peer.context.terminal = ctx;

    const logger = baseLogger.child({ clientId });
    logger.info('Websocket terminal connection authorized');

    try {
      // Provisioning phase
      logger.info('Provisioning terminal container');
      peer.send(encode({ type: 'terminal/status', status: 'PROVISIONING' }));
      const connectionInfo = await provisioner.ensureContainerExists(clientId);
      logger.debug({ status: ctx.status }, 'Provisioning complete, connecting via SSH');

      // Connection phase
      ctx.status = 'CONNECTING';
      peer.send(encode({ type: 'terminal/status', status: 'CONNECTING' }));
      logger.debug('Creating SSH session for client');

      const tasks = await database.topics.completion.getEvaluatorTasks(clientId, slug);
      const watchPaths = new Set(tasks.flatMap(task => task.watchPath ? [task.watchPath] : []));

      const execCommand = watchPaths.size
        ? `inotifywait -m --format '%w|%e|%f' -- ${Array.from(watchPaths).map(shellQuotePosix).join(' ')}`
        : undefined;

      ctx.evaluator = createEvaluator({ tasks });
      ctx.session = await createSession({
        ...connectionInfo,
        execCommand,
        rows,
        cols,
      });

      ctx.status = 'READY';

      // SSH -> WebSocket data forwarding
      // SSH -> Evaluator data forwarding
      ctx.session.onData((data) => {
        peer.send(encode({ type: 'terminal/output', data }));
        ctx.evaluator?.bufferShell(data);
      });

      // EXEC -> Evaluator data forwarding
      ctx.session.onExecData((data) => {
        ctx.evaluator?.bufferExec(data);
      });

      // Evaluator -> WebSocket data forwarding
      ctx.evaluator.onComplete(async (completed) => {
        await database.topics.completion.completeTasks(clientId, completed);
        for (const taskId of completed) {
          peer.send(encode({ type: 'task/done', taskId }));
        }
      });

      ctx.evaluator.onError((error) => {
        logger.error(error, 'Failed to complete tasks');
      });

      // SSH -> WebSocket closure forwarding
      ctx.session.onClose(() => {
        if (ctx.status === 'CLOSED' || ctx.status === 'ERROR') {
          return;
        }

        peer.send(encode({
          type: 'terminal/status',
          status: 'CLOSED',
          code: 'SESSION_ENDED',
          message: 'Terminal session ended',
        }));

        peer.close(1000, 'SSH connection closed');
      });

      ctx.session.onError((error) => {
        if (ctx.status === 'CLOSED' || ctx.status === 'ERROR') {
          return;
        }

        ctx.status = 'ERROR';
        peer.send(encode({
          type: 'terminal/status',
          status: 'ERROR',
          code: 'INTERNAL_ERROR',
          message: 'SSH connection error',
        }));

        logger.error(error, 'SSH session error');
        peer.close(1011, 'SSH connection error');
      });

      // Ready phase
      peer.send(encode({ type: 'terminal/status', status: 'READY' }));
      logger.info('Terminal session created');
    }
    catch (error) {
      if (error instanceof TopicNotFoundError) {
        ctx.status = 'ERROR';
        peer.send(encode({
          type: 'terminal/status',
          status: 'ERROR',
          message: 'Unknown topic',
        }));

        peer.close(1008, 'Unknown topic');
        return;
      }

      const phase = ctx.status;
      let code: ErrorCode = 'INTERNAL_ERROR';

      if (phase === 'PROVISIONING') {
        code = 'PROVISION_ERROR';
      }
      else if (phase === 'CONNECTING') {
        code = 'CONNECT_ERROR';
      }

      logger.error(error, 'Failed to establish terminal session');
      logger.debug({ phase, code }, 'Terminal session failure context');

      const message = code === 'PROVISION_ERROR'
        ? 'Failed to provision your environment, please try again later'
        : code === 'CONNECT_ERROR'
          ? 'Failed to connect to your environment, please try again later'
          : 'Internal Server Error';

      ctx.status = 'ERROR';
      peer.send(encode({
        type: 'terminal/status',
        status: 'ERROR',
        code,
        message,
      }));

      peer.close(1011, message);
    }
  },

  // WebSocket -> SSH data forwarding
  message(peer, message) {
    const raw = message.text();

    const msg = decode(raw);
    if (!msg) {
      baseLogger.warn({ rawMessageLength: raw.length }, 'Invalid websocket message');
      return;
    }

    const ctx = peer.context.terminal as TerminalContext | undefined;
    const logger = ctx ? baseLogger.child({ clientId: ctx.clientId }) : baseLogger;

    if (!ctx || ctx.status !== 'READY' || !ctx.session) {
      logger.warn({ state: ctx?.status }, 'Received terminal message before READY');
      return;
    }

    switch (msg.type) {
      case 'terminal/input': {
        ctx.session.write(msg.data);
        break;
      }
      case 'terminal/resize': {
        ctx.session.resize(msg.rows, msg.cols);
        break;
      }
      case 'tasks/reset': {
        ctx.evaluator?.reset();
        logger.info('Tasks reset');
        break;
      }
      default: {
        logger.warn({ type: msg.type }, 'Unexpected message type from client');
        break;
      }
    }

    const now = Date.now();
    if (now - ctx.lastExpirationUpdateAt > EXPIRATION_UPDATE_INTERVAL_MS) {
      ctx.lastExpirationUpdateAt = now;
      provisioner.updateContainerExpiration(ctx.clientId)
        .catch((error) => {
          logger.error(error, 'Failed to update container expiration');
        });
    }
  },

  // WebSocket -> SSH closure forwarding
  close(peer) {
    const ctx = peer.context.terminal as TerminalContext | undefined;
    if (!ctx) {
      return;
    }

    const logger = baseLogger.child({ clientId: ctx.clientId });
    logger.info({ status: ctx.status }, 'Client websocket closed, shutting down session');

    ctx.status = 'CLOSED';
    ctx.evaluator?.dispose();
    ctx.session?.close();
  },
});
