import * as schema from '@terminal/database/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { useDatabase } from '~~/server/lib/database';
import { useEnv } from '~~/server/lib/env';
import { useLogger } from '~~/server/lib/logger';

let _auth: Auth | undefined;

export function useAuth() {
  if (!_auth) {
    const env = useEnv();
    const db = useDatabase();
    const logger = useLogger().child({ caller: 'auth' });

    _auth = betterAuth({
      secret: env.AUTH_SECRET,
      database: drizzleAdapter(db, {
        provider: 'mysql',
        usePlural: true,
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
      plugins: [],
      logger: {
        log: (level, message, ...args) => {
          logger[level](message, ...args);
        },
      },
    });
  }

  return _auth;
}

export type Auth = ReturnType<typeof betterAuth>;
