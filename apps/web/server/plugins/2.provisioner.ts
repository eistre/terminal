import process from 'node:process';
import { useLogger } from '~~/server/lib/logger';
import { useProvisioner } from '~~/server/lib/provisioner';

/**
 * This plugin initializes the provisioner when the server starts
 * and cleans up any expired containers left hanging.
 */
export default defineNitroPlugin(async () => {
  const logger = useLogger().child({ caller: 'provisioner' });

  try {
    logger.info('Initializing provisioner and cleaning up expired containers');

    const provisioner = useProvisioner();
    const containers = await provisioner.listContainers();

    const now = new Date();
    const expired = containers.filter(container => container.expiresAt <= now);

    if (expired.length > 0) {
      logger.debug('Cleaning up all expired containers');
      await Promise.all(expired.map(container => provisioner.deleteContainer(container.clientId)));
    }

    logger.info({ totalContainer: containers.length, expiredContainer: expired.length }, 'Provisioner initialized and cleanup complete');
  }
  catch (error) {
    logger.error(error, 'Failed to initialize provisioner or clean up containers');

    // Exit the process with a non-zero code to indicate failure
    process.exit(1);
  }
});
