import { requireAdmin } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useLogger } from '~~/server/lib/logger';

export default defineEventHandler(async (event) => {
  const database = useDatabase();
  const logger = useLogger();

  await requireAdmin(event);

  try {
    const domains = await database.emailDomains.catalog.list();
    return { domains };
  }
  catch (error) {
    logger.error(error, 'Failed to list email domains');
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
