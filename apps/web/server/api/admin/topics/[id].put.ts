import { upsertTopicPayloadSchema } from '#shared/topics-validation';
import { TopicSlugConflictError } from '@terminal/database';
import { z } from 'zod';
import { requireAdmin } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useLogger } from '~~/server/lib/logger';

const routeSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export default defineEventHandler(async (event) => {
  const database = useDatabase();
  const logger = useLogger();

  const userSession = await requireAdmin(event);

  const parsed = await getValidatedRouterParams(event, data => routeSchema.safeParse(data));
  const parsedPayload = upsertTopicPayloadSchema.safeParse(await readBody(event));

  if (!parsed.success || !parsedPayload.success) {
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

    logger.info({ userId: userSession.user.id, topicId: result.topicId }, 'Topic updated');
    return { topicId: result.topicId };
  }
  catch (error) {
    if (error instanceof TopicSlugConflictError) {
      throw createError({ statusCode: 409, statusMessage: 'Slug already exists' });
    }

    logger.error(error, `Failed to upsert topic with id: ${parsed.data.id}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
