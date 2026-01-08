import { localeSchema } from '#shared/locale';
import { z } from 'zod';
import { requireSession } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useLogger } from '~~/server/lib/logger';

const querySchema = z.object({
  locale: localeSchema.default('en'),
});

export default defineEventHandler(async (event) => {
  const database = useDatabase();
  const logger = useLogger();

  const session = await requireSession(event);

  const userId = session.user.id;
  const { locale } = await getValidatedQuery(event, data => querySchema.parse(data));

  try {
    return await database.topics.catalog.getTopics(userId, locale);
  }
  catch (error) {
    logger.error(error, `Failed to get topics for user: ${userId}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
