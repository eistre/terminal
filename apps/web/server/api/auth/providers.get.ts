import { useEnv } from '~~/server/lib/env';

export default defineEventHandler(() => {
  const env = useEnv();
  return {
    microsoft: {
      enabled: Boolean(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET && env.MICROSOFT_TENANT_ID),
      label: env.MICROSOFT_CLIENT_NAME,
    },
  };
});
