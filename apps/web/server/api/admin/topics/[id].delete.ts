import { z } from 'zod';
import { useAuth } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useLogger } from '~~/server/lib/logger';

const routeSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export default defineEventHandler(async (event) => {
  const auth = useAuth();
  const database = useDatabase();
  const logger = useLogger();

  const userSession = await auth.api.getSession({ headers: event.headers });
  if (!userSession) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const parsed = await getValidatedRouterParams(event, data => routeSchema.safeParse(data));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' });
  }

  try {
    await database.topics.admin.deleteTopic(parsed.data.id);
    logger.info({ userId: userSession.user.id, topicId: parsed.data.id }, 'Topic deleted');
  }
  catch (error) {
    logger.error(error, `Failed to delete topic with id: ${parsed.data.id}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
