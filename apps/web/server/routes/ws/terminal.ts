import type { ErrorCode, Status } from '#shared/protocol';
import type { Session } from '@terminal/session';
import { decode, encode } from '#shared/protocol';
import { createSession } from '@terminal/session';
import { useAuth } from '~~/server/lib/auth';
import { useEnv } from '~~/server/lib/env';
import { useLogger } from '~~/server/lib/logger';
import { useProvisioner } from '~~/server/lib/provisioner';

interface TerminalContext {
  clientId: string;
  session?: Session;
  status: Status;
  lastExpirationUpdateAt: number;
}

const EXPIRATION_UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const env = useEnv();
const auth = useAuth();
const provisioner = useProvisioner();
const baseLogger = useLogger().child({ caller: 'socket' });

function parseRowsAndCols(requestUrl: string): { rows: number | undefined; cols: number | undefined } {
  const url = new URL(requestUrl, 'http://localhost');

  const rawRows = url.searchParams.get('rows');
  const rawCols = url.searchParams.get('cols');

  const rows = Number.parseInt(rawRows ?? '0', 10);
  const cols = Number.parseInt(rawCols ?? '0', 10);

  return {
    rows: Number.isFinite(rows) && rows > 0 ? rows : undefined,
    cols: Number.isFinite(cols) && cols > 0 ? cols : undefined,
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
    const { rows, cols } = parseRowsAndCols(peer.request.url);
    const ctx: TerminalContext = {
      clientId,
      session: undefined,
      status: 'PROVISIONING',
      lastExpirationUpdateAt: Date.now(),
    };

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

      const session = await createSession({
        ...connectionInfo,
        privateKey: env.PROVISIONER_CONTAINER_SSH_PRIVATE_KEY,
        rows,
        cols,
      });

      ctx.session = session;
      ctx.status = 'READY';

      // SSH -> WebSocket data forwarding
      session.onData((data) => {
        peer.send(encode({ type: 'terminal/output', data }));
      });

      // SSH -> WebSocket closure forwarding
      session.onClose(() => {
        if (ctx.status === 'CLOSED' || ctx.status === 'CLOSING') {
          return;
        }

        ctx.status = 'CLOSED';
        peer.send(encode({
          type: 'terminal/status',
          status: 'CLOSED',
          code: 'SESSION_ENDED',
          message: 'Terminal session ended',
        }));

        logger.info({ status: ctx.status }, 'SSH session closed, closing websocket');
        peer.close(1000, 'SSH connection closed');
      });

      // Ready phase
      peer.send(encode({ type: 'terminal/status', status: 'READY' }));
      logger.info('Terminal session created');
    }
    catch (error) {
      const phase = (peer.context.terminal as TerminalContext | undefined)?.status;
      let code: ErrorCode = 'INTERNAL_ERROR';

      if (phase === 'PROVISIONING') {
        code = 'PROVISION_ERROR';
      }
      else if (phase === 'CONNECTING') {
        code = 'CONNECT_ERROR';
      }

      logger.error(error, 'Failed to establish terminal session');
      logger.debug({ phase, code }, 'Terminal session failure context');

      const message
        = code === 'PROVISION_ERROR'
          ? 'Failed to provision your environment, please try again later'
          : 'Failed to connect to your environment, please try again later';

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

    if (ctx.status === 'CLOSED' || ctx.status === 'CLOSING') {
      return;
    }

    logger.info({ status: ctx.status }, 'Client websocket closed, shutting down session');

    ctx.status = 'CLOSING';
    if (ctx.session) {
      ctx.session.close();
    }
  },
});
