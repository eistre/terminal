import process from 'node:process';
import { useLogger } from '~~/server/lib/logger';
import { useProvisioner } from '~~/server/lib/provisioner';

/**
 * This plugin initializes the provisioner when the server starts
 * and cleans up any expired containers left hanging.
 */
// TODO think about logging
export default defineNitroPlugin(async () => {
  const logger = useLogger();

  try {
    const provisioner = useProvisioner();
    const containers = await provisioner.listContainers();

    const now = new Date();
    const expired = containers.filter(container => container.expireTime <= now);

    logger.debug('Cleaning up all expired containers');
    await Promise.all(expired.map(container => provisioner.deleteContainer(container.clientId)));
    logger.info('Provisioner initialized and cleanup complete');
  }
  catch (error) {
    logger.error(error, 'Failed to initialize provisioner or clean up containers');

    // Exit the process with a non-zero code to indicate failure
    process.exit(1);
  }
});
