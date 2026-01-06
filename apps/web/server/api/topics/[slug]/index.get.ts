import { localeSchema } from '#shared/locale';
import { TopicNotFoundError } from '@terminal/database';
import { z } from 'zod';
import { requireSession } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useLogger } from '~~/server/lib/logger';

const routeSchema = z.object({
  slug: z.string(),
});

const querySchema = z.object({
  locale: localeSchema.default('en'),
});

export default defineEventHandler(async (event) => {
  const database = useDatabase();
  const logger = useLogger();

  const session = await requireSession(event);

  const userId = session.user.id;
  const { locale } = await getValidatedQuery(event, data => querySchema.parse(data));
  const { slug } = await getValidatedRouterParams(event, data => routeSchema.parse(data));

  try {
    return await database.topics.catalog.getTopic(userId, slug, locale);
  }
  catch (error) {
    if (error instanceof TopicNotFoundError) {
      throw createError({ statusCode: 404, statusMessage: 'Topic Not Found' });
    }

    logger.error(error, `Failed to get topic with slug: ${slug} for user: ${userId}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
