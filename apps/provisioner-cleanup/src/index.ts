import type { LoggerSchema } from '@terminal/env/schemas';
import process from 'node:process';
import { loadEnv } from '@terminal/env';
import { loggerSchema, provisionerSchema } from '@terminal/env/schemas';
import { createLogger } from '@terminal/logger';
import { createProvisioner } from '@terminal/provisioner';

const envSchema = provisionerSchema.and(loggerSchema);

async function main() {
  const env = loadEnv(envSchema);
  const logger = createLogger({
    name: 'provisioner-cleanup',
    ...env as LoggerSchema,
  });
  const provisioner = createProvisioner(logger, env);

  try {
    logger.info('Starting provisioner cleanup');

    // List all containers
    const containers = await provisioner.listContainers();
    logger.debug({ totalContainers: containers.length }, 'Retrieved container list');

    // Filter expired containers
    const now = new Date();
    const expired = containers.filter(container => container.expiresAt <= now);

    logger.info({ totalContainers: containers.length, expiredContainers: expired.length }, `Found ${expired.length} expired ${expired.length === 1 ? 'container' : 'containers'}`);

    // Delete expired containers
    const results = await Promise.allSettled(
      expired.map(container => provisioner.deleteContainer(container.clientId)),
    );

    let successCount = 0;
    let failureCount = 0;
    results.forEach((result, index) => {
      const container = expired[index];
      if (!container) {
        return;
      }

      if (result.status === 'fulfilled') {
        successCount++;
        logger.debug({ clientId: container.clientId }, `Deleted container: ${container.clientId}`);
      }
      else {
        failureCount++;
        logger.warn({ clientId: container.clientId, error: result.reason }, `Failed to delete container: ${container.clientId}`);
      }
    });

    if (failureCount === 0) {
      logger.info({ successCount, failureCount }, 'Provisioner cleanup completed successfully');
    }
    else {
      logger.warn({ successCount, failureCount }, 'Provisioner cleanup completed with some failures');
    }
  }
  catch (error) {
    logger.error(error, 'Provisioner cleanup failed');
    process.exit(1);
  }
}

void main();
