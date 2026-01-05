import { localeSchema } from '#shared/locale';
import { z } from 'zod';
import { useAuth } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useLogger } from '~~/server/lib/logger';

const querySchema = z.object({
  locale: localeSchema.default('en'),
});

export default defineEventHandler(async (event) => {
  const auth = useAuth();
  const database = useDatabase();
  const logger = useLogger();

  const userSession = await auth.api.getSession({ headers: event.headers });
  if (!userSession) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const userId = userSession.user.id;
  const { locale } = await getValidatedQuery(event, data => querySchema.parse(data));

  try {
    return await database.topics.catalog.getTopics(userId, locale);
  }
  catch (error) {
    logger.error(error, `Failed to get topics for user: ${userId}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
