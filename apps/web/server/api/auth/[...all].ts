import { useAuth } from '~~/server/lib/auth';

export default defineEventHandler((event) => {
  const auth = useAuth();
  return auth.handler(toWebRequest(event));
});
