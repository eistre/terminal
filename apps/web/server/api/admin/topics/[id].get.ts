import { TopicNotFoundError } from '@terminal/database';
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

  await requireAdmin(event);

  const parsed = await getValidatedRouterParams(event, data => routeSchema.safeParse(data));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' });
  }

  try {
    return await database.topics.admin.getTopic(parsed.data.id);
  }
  catch (error) {
    if (error instanceof TopicNotFoundError) {
      throw createError({ statusCode: 404, statusMessage: 'Topic Not Found' });
    }

    logger.error(error, `Failed to get edit topic payload with id: ${parsed.data.id}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
