import * as schema from '@terminal/database/schema/auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { useDatabase } from '~~/server/lib/database';
import { useEnv } from '~~/server/lib/env';
import { useLogger } from '~~/server/lib/logger';

let _auth: Auth | undefined;

export function useAuth() {
  if (!_auth) {
    const env = useEnv();
    const database = useDatabase();
    const logger = useLogger().child({ caller: 'auth' });

    _auth = betterAuth({
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
