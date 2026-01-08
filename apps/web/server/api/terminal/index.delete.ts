import { requireSession } from '~~/server/lib/auth';
import { useLogger } from '~~/server/lib/logger';
import { useProvisioner } from '~~/server/lib/provisioner';

export default defineEventHandler(async (event) => {
  const logger = useLogger();

  const session = await requireSession(event);
  const provisioner = useProvisioner();

  try {
    await provisioner.deleteContainer(session.user.id);
  }
  catch (error) {
    logger.error(error, `Failed to delete terminal container for user: ${session.user.id}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
