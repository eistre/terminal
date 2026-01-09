import type { DatabaseSchema } from '@terminal/env/schemas';
import { drizzle } from 'drizzle-orm/mysql2';
import { createEmailDomainsRepo } from './email-domains/index.js';
import { createOps } from './ops/index.js';
import { createTopicsRepo } from './topics/index.js';
import { createUsersRepo } from './users/index.js';
import { createVerificationsRepo } from './verifications/index.js';

export function createDatabase(options: DatabaseSchema) {
  const db = drizzle(options.DATABASE_URL, {
    casing: 'snake_case',
  });

  return {
    db,
    emailDomains: createEmailDomainsRepo(db),
    topics: createTopicsRepo(db),
    users: createUsersRepo(db),
    verifications: createVerificationsRepo(db),
    ops: createOps(db),
  };
}

export { EmailDomainConflictError, EmailDomainNotFoundError } from './email-domains/index.js';
export * from './seeds/index.js';
export { TopicNotFoundError, TopicSlugConflictError } from './topics/index.js';
export * from './types/index.js';
export type Database = ReturnType<typeof createDatabase>;
