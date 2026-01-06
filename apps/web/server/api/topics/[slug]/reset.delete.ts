import { z } from 'zod';
import { requireSession } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useLogger } from '~~/server/lib/logger';

const routeSchema = z.object({
  slug: z.string(),
});

export default defineEventHandler(async (event) => {
  const database = useDatabase();
  const logger = useLogger();

  const session = await requireSession(event);

  const userId = session.user.id;
  const { slug } = await getValidatedRouterParams(event, data => routeSchema.parse(data));

  try {
    await database.topics.completion.resetTopic(userId, slug);
  }
  catch (error) {
    logger.error(error, `Failed to reset topic with slug: ${slug} for user: ${userId}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
