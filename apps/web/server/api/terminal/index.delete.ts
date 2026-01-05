import { useAuth } from '~~/server/lib/auth';
import { useLogger } from '~~/server/lib/logger';
import { useProvisioner } from '~~/server/lib/provisioner';

export default defineEventHandler(async (event) => {
  const auth = useAuth();
  const logger = useLogger();

  const userSession = await auth.api.getSession({ headers: event.headers });
  if (!userSession) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const provisioner = useProvisioner();

  try {
    await provisioner.deleteContainer(userSession.user.id);
  }
  catch (error) {
    logger.error(error, `Failed to delete terminal container for user: ${userSession.user.id}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
