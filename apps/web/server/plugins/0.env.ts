import type { PublicConfig } from '#shared/public-config';
import type { LoggerSchema } from '@terminal/env/schemas';
import process from 'node:process';
import { createLogger } from '@terminal/logger';
import { useEnv } from '~~/server/lib/env';

/**
 * Validates environment variables at server startup.
 * Will prevent server from starting if validation fails.
 */
export default defineNitroPlugin((nitroApp) => {
  // Create a logger with fallback values since environment validation hasn't occurred yet
  const logger = createLogger({
    name: 'nuxt',
    LOG_LEVEL: (process.env.LOG_LEVEL as LoggerSchema['LOG_LEVEL']) || 'info',
    NODE_ENV: (process.env.NODE_ENV as LoggerSchema['NODE_ENV']) || 'development',
  }).child({ caller: 'env' });

  try {
    // Attempts to load and validate environment variables
    logger.info('Validating environment configuration');
    const env = useEnv();
    logger.info('Environment configuration validated successfully');

    const config: PublicConfig = {
      emailVerificationEnabled: env.MAILER_TYPE !== 'noop',
      adminEmail: env.ADMIN_EMAIL,
    };

    if (env.MICROSOFT_CLIENT_ID) {
      config.microsoft = {
        labels: {
          en: env.MICROSOFT_LABEL_EN ?? 'Microsoft',
          et: env.MICROSOFT_LABEL_ET ?? 'Microsoft',
        },
      };
    }

    nitroApp.hooks.hook('request', (event) => {
      event.context.config = config;
    });
  }
  catch (error) {
    logger.error(error, 'Environment validation failed');

    // Exit the process with a non-zero code to indicate failure
    process.exit(1);
  }
});
