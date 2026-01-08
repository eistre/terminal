import { upsertTopicPayloadSchema } from '#shared/topics-validation';
import { TopicSlugConflictError } from '@terminal/database';
import { requireAdmin } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useLogger } from '~~/server/lib/logger';

export default defineEventHandler(async (event) => {
  const database = useDatabase();
  const logger = useLogger();

  const userSession = await requireAdmin(event);

  const parsedPayload = upsertTopicPayloadSchema.safeParse(await readBody(event));
  if (!parsedPayload.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' });
  }

  try {
    const result = await database.topics.admin.upsertTopic({
      topic: { slug: parsedPayload.data.topic.slug },
      translations: parsedPayload.data.translations,
      tasks: parsedPayload.data.tasks,
    });

    logger.info({ userId: userSession.user.id, topicId: result.topicId }, 'Topic created');
    return { topicId: result.topicId };
  }
  catch (error) {
    if (error instanceof TopicSlugConflictError) {
      throw createError({ statusCode: 409, statusMessage: 'Slug already exists' });
    }

    logger.error(error, 'Failed to create topic');
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
