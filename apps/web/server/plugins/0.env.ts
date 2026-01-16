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
    LOGGER_LEVEL: (process.env.LOGGER_LEVEL as LoggerSchema['LOGGER_LEVEL']) || 'info',
    NODE_ENV: (process.env.NODE_ENV as LoggerSchema['NODE_ENV']) || 'development',
  }).child({ caller: 'env' });

  try {
    // Attempts to load and validate environment variables
    logger.info('Validating environment configuration');
    const env = useEnv();
    logger.info('Environment configuration validated successfully');

    const config: PublicConfig = {
      emailVerificationEnabled: env.MAILER_TYPE !== 'noop',
      adminEmail: env.AUTH_ADMIN_EMAIL,
      providers: {},
    };

    if (env.AUTH_MICROSOFT_CLIENT_ID) {
      config.providers.microsoft = {
        labels: {
          en: env.AUTH_MICROSOFT_LABEL_EN || 'Microsoft',
          et: env.AUTH_MICROSOFT_LABEL_ET || 'Microsoft',
        },
      };
    }

    if (env.AUTH_KEYCLOAK_CLIENT_ID) {
      config.providers.keycloak = {
        labels: {
          en: env.AUTH_KEYCLOAK_LABEL_EN || 'Keycloak',
          et: env.AUTH_KEYCLOAK_LABEL_ET || 'Keycloak',
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
