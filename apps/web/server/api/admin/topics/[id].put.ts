import { upsertTopicPayloadSchema } from '#shared/topics-validation';
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

  const parsedPayload = upsertTopicPayloadSchema.safeParse(await readBody(event));
  if (!parsedPayload.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' });
  }

  if (parsedPayload.data.topic.id !== undefined && parsedPayload.data.topic.id !== parsed.data.id) {
    throw createError({ statusCode: 400, statusMessage: 'Topic id mismatch' });
  }

  try {
    const result = await database.topics.admin.upsertTopic({
      topic: { id: parsed.data.id, slug: parsedPayload.data.topic.slug },
      translations: parsedPayload.data.translations,
      tasks: parsedPayload.data.tasks,
    });

    return { topicId: result.topicId };
  }
  catch (error) {
    logger.error(error, `Failed to upsert topic with id: ${parsed.data.id}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
