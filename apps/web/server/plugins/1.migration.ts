import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runMigration } from '@terminal/database/migration';
import { useDatabase } from '~~/server/lib/database';
import { useEnv } from '~~/server/lib/env';
import { useLogger } from '~~/server/lib/logger';

/**
 * This plugin runs the database migrations when the server starts.
 * It ensures that the database schema is up to date before handling requests.
 */
export default defineNitroPlugin(async () => {
  const env = useEnv();
  const db = useDatabase();
  const logger = useLogger();

  try {
    logger.info('Running database migrations');

    const migrationsPath = env.NODE_ENV === 'production'
      ? './server/migrations'
      : resolve(fileURLToPath(import.meta.url), '../migrations');

    await runMigration(db, migrationsPath);
    logger.info('Database migration completed successfully');
  }
  catch (error) {
    logger.error(error, 'Database migration failed');

    // Exit the process with a non-zero code to indicate failure
    process.exit(1);
  }
});
