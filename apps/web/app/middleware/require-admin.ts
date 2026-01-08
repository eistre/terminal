import { authClient } from '~/composables/auth-client';

export default defineNuxtRouteMiddleware(async () => {
  const { data: session } = await authClient.useSession(useFetch);

  if (session.value?.user.role !== 'admin') {
    return navigateTo('/topics');
  }
});
