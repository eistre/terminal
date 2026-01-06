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

  const parsedRoute = await getValidatedRouterParams(event, data => routeSchema.safeParse(data));
  if (!parsedRoute.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' });
  }

  try {
    await database.emailDomains.admin.deleteDomain(parsedRoute.data.id);
    logger.info({ userId: userSession.user.id, emailDomainId: parsedRoute.data.id }, 'Email domain deleted');
  }
  catch (error) {
    logger.error(error, `Failed to delete email domain with id: ${parsedRoute.data.id}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
