import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { defaultEmailDomainSeeds, defaultTopicSeeds } from '@terminal/database';
import { useAuth } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useEnv } from '~~/server/lib/env';
import { useLogger } from '~~/server/lib/logger';

/**
 * This plugin bootstraps the database when the server starts.
 * It runs migrations and seeds initial data before handling requests.
 */
export default defineNitroPlugin(async (nitroApp) => {
  const env = useEnv();
  const auth = useAuth();
  const database = useDatabase();
  const logger = useLogger().child({ caller: 'database' });

  try {
    const migrationsPath = env.NODE_ENV === 'production'
      ? './server/migrations'
      : resolve(fileURLToPath(import.meta.url), '../migrations');

    logger.debug({ nodeEnv: env.NODE_ENV, migrationsPath }, 'Resolved migrations path');
    logger.info({ migrationsPath }, 'Running database migrations');

    await database.ops.runMigration(migrationsPath);
    logger.info('Database migrations completed successfully');

    logger.debug({ seedCount: defaultTopicSeeds.length }, 'Seeding database (if empty)');
    const topics = await database.ops.seedTopicsIfEmpty(defaultTopicSeeds);
    const domains = await database.ops.seedEmailDomainsIfEmpty(defaultEmailDomainSeeds);

    logger.info({ topics, domains }, 'Database seeding process completed');

    const email = env.AUTH_ADMIN_EMAIL;
    const adminEnsured = await database.users.admin.ensureUserRole({ email, role: 'admin' });
    if (!adminEnsured) {
      try {
        await auth.api.createUser({
          body: {
            email,
            name: 'admin',
            password: env.AUTH_ADMIN_PASSWORD,
            role: 'admin',
            data: { emailVerified: true },
          },
        });

        logger.info({ email }, 'Created default admin user');
      }
      catch (error) {
        // Multi-instance startup can race: another instance may create the user first.
        const ensuredAfterError = await database.users.admin.ensureUserRole({ email, role: 'admin' });
        if (!ensuredAfterError) {
          logger.error(error, 'Failed to create default admin user');

          // Exit the process with a non-zero code to indicate failure
          process.exit(1);
        }

        logger.info({ email }, 'Default admin user created by another instance');
      }
    }

    // Ensure database connection is closed on server shutdown
    nitroApp.hooks.hook('close', () => database.close());
  }
  catch (error) {
    logger.error(error, 'Database bootstrap failed');

    // Exit the process with a non-zero code to indicate failure
    process.exit(1);
  }
});
