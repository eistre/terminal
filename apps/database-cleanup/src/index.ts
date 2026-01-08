import type { LoggerSchema } from '@terminal/env/schemas';
import process from 'node:process';
import { createDatabase } from '@terminal/database';
import { loadEnv } from '@terminal/env';
import { databaseSchema, loggerSchema } from '@terminal/env/schemas';
import { createLogger } from '@terminal/logger';

const envSchema = databaseSchema.and(loggerSchema);

async function main() {
  const env = loadEnv(envSchema);
  const database = createDatabase(env);
  const logger = createLogger({
    name: 'database-cleanup',
    ...env as LoggerSchema,
  });

  try {
    logger.info('Starting database cleanup');

    // Delete expired users
    const deletedUsersCount = await database.users.admin.deleteExpiredUsers();
    if (deletedUsersCount > 0) {
      logger.debug({ count: deletedUsersCount }, `Deleted ${deletedUsersCount} expired ${deletedUsersCount === 1 ? 'user' : 'users'}`);
    }
    else {
      logger.debug('No expired users to delete');
    }

    // Delete expired verifications
    const deletedVerificationsCount = await database.verifications.admin.deleteExpiredVerifications();
    if (deletedVerificationsCount > 0) {
      logger.debug({ count: deletedVerificationsCount }, `Deleted ${deletedVerificationsCount} expired ${deletedVerificationsCount === 1 ? 'verification' : 'verifications'}`);
    }
    else {
      logger.debug('No expired verifications to delete');
    }

    logger.info({ deletedUsers: deletedUsersCount, deletedVerifications: deletedVerificationsCount }, 'Database cleanup completed successfully');
  }
  catch (error) {
    logger.error(error, 'Database cleanup failed');
    process.exit(1);
  }
}

void main();
