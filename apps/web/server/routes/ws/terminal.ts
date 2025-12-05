import { encode } from '#shared/protocol';
import { useAuth } from '~~/server/lib/auth';
import { useLogger } from '~~/server/lib/logger';
import { useProvisioner } from '~~/server/lib/provisioner';

const auth = useAuth();
const provisioner = useProvisioner();
const logger = useLogger();

export default defineWebSocketHandler({
  async open(peer) {
    const session = await auth.api.getSession({
      headers: peer.request.headers,
    });

    if (!session) {
      // TODO is it good to log remote address?
      logger.warn({ ip: peer.remoteAddress }, 'Unauthorized WebSocket connection attempt');
      return peer.close(1008, 'Unauthorized');
    }

    const clientId = session.user.id;
    peer.context.clientId = clientId;

    // Start provisioning the container
    peer.send(encode({ type: 'terminal/status', status: 'PROVISIONING' }));
    await provisioner.createOrUpdateContainer(clientId); // TODO should we rename clientId to userId / containerId?
    peer.send(encode({ type: 'terminal/status', status: 'ATTACHING' }));

    // TODO once ready create exec session
    // TODO save exec session to peer.context, along with lastActiveTime and lastUpdateTime (for debounced expiration updates)

    peer.send(encode({ type: 'terminal/status', status: 'READY' }));
  },
  message() {
  },
});
