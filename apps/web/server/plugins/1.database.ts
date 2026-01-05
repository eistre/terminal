import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { defaultTopicSeeds } from '@terminal/database';
import { useDatabase } from '~~/server/lib/database';
import { useEnv } from '~~/server/lib/env';
import { useLogger } from '~~/server/lib/logger';

/**
 * This plugin bootstraps the database when the server starts.
 * It runs migrations and seeds initial data before handling requests.
 */
export default defineNitroPlugin(async () => {
  const env = useEnv();
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
    if (await database.ops.seedIfEmpty(defaultTopicSeeds)) {
      logger.info('Database seeded successfully');
    }
    else {
      logger.info('Database seeding skipped (already initialized)');
    }
  }
  catch (error) {
    logger.error(error, 'Database bootstrap failed');

    // Exit the process with a non-zero code to indicate failure
    process.exit(1);
  }
});
