import type { DatabaseSchema } from '@terminal/env/schemas';
import type { SslOptions } from 'mysql2';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { createEmailDomainsRepo } from './email-domains/index.js';
import { createOps } from './ops/index.js';
import { createTopicsRepo } from './topics/index.js';
import { createUsersRepo } from './users/index.js';
import { createVerificationsRepo } from './verifications/index.js';

function buildSslConfig(options: DatabaseSchema): SslOptions | undefined {
  if (!options.DATABASE_SSL_ENABLED) {
    return undefined;
  }

  const ca = options.DATABASE_SSL_CA_BASE64
    ? Buffer.from(options.DATABASE_SSL_CA_BASE64, 'base64').toString('utf-8')
    : undefined;

  const caFromPath = options.DATABASE_SSL_CA
    ? readFileSync(options.DATABASE_SSL_CA, 'utf-8')
    : undefined;

  return {
    ca: ca ?? caFromPath,
    rejectUnauthorized: true,
  };
}

export function createDatabase(options: DatabaseSchema) {
  const ssl = buildSslConfig(options);

  const db = drizzle({
    connection: {
      uri: options.DATABASE_URL,
      ssl,
    },
    casing: 'snake_case',
  });

  return {
    db,
    emailDomains: createEmailDomainsRepo(db),
    topics: createTopicsRepo(db),
    users: createUsersRepo(db),
    verifications: createVerificationsRepo(db),
    ops: createOps(db),
    close: () => {
      db.$client.end();
    },
  };
}

export { EmailDomainConflictError, EmailDomainNotFoundError } from './email-domains/index.js';
export * from './seeds/index.js';
export { TopicNotFoundError, TopicSlugConflictError } from './topics/index.js';
export * from './types/index.js';
export type Database = ReturnType<typeof createDatabase>;
