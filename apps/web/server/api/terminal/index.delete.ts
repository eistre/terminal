import { useAuth } from '~~/server/lib/auth';
import { useProvisioner } from '~~/server/lib/provisioner';

export default defineEventHandler(async (event) => {
  const auth = useAuth();

  const userSession = await auth.api.getSession({ headers: event.headers });
  if (!userSession) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const provisioner = useProvisioner();
  await provisioner.deleteContainer(userSession.user.id);
});
