import type { LoggerSchema } from '@terminal/env';
import process from 'node:process';
import { createLogger } from '@terminal/logger';
import { useEnv } from '~~/server/lib/env';

/**
 * Validates environment variables at server startup.
 * Will prevent server from starting if validation fails.
 */
export default defineNitroPlugin(async () => {
  // Create a logger with fallback values since environment validation hasn't occurred yet
  const logger = createLogger({
    name: 'nuxt',
    LOG_LEVEL: (process.env.LOG_LEVEL as LoggerSchema['LOG_LEVEL']) || 'info',
    NODE_ENV: (process.env.NODE_ENV as LoggerSchema['NODE_ENV']) || 'development',
  });

  try {
    // Attempts to load and validate environment variables
    logger.info('Validating environment variables');
    useEnv();
    logger.info('Environment validation succeeded');
  }
  catch (error) {
    logger.error(error, 'Environment validation failed');

    // Exit the process with a non-zero code to indicate failure
    process.exit(1);
  }
});
