import type { SocialProviders } from 'better-auth';
import type { H3Event } from 'h3';
import * as schema from '@terminal/database/schema/auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { useDatabase } from '~~/server/lib/database';
import { useEnv } from '~~/server/lib/env';
import { useLogger } from '~~/server/lib/logger';

let _auth: Auth | undefined;

function createAuth() {
  const env = useEnv();
  const database = useDatabase();
  const logger = useLogger().child({ caller: 'auth' });

  const socialProviders: SocialProviders = {};

  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET && env.MICROSOFT_TENANT_ID) {
    socialProviders.microsoft = {
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      tenantId: env.MICROSOFT_TENANT_ID,
      disableProfilePhoto: true,
      prompt: 'select_account',
    };
  }

  return betterAuth({
    socialProviders,
    secret: env.AUTH_SECRET,
    database: drizzleAdapter(database.db, {
      provider: 'mysql',
      usePlural: true,
      transaction: true,
      schema: {
        ...schema,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    plugins: [admin()],
    logger: {
      log: (level, message, ...args) => {
        logger[level]({ ...args }, message);
      },
    },
  });
}

export function useAuth() {
  if (!_auth) {
    _auth = createAuth();
  }

  return _auth;
}

export type Auth = ReturnType<typeof createAuth>;

export async function requireSession(event: H3Event) {
  const auth = useAuth();
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  return session;
}

export async function requireAdmin(event: H3Event) {
  const session = await requireSession(event);

  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  return session;
}
