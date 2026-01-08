import type { DatabaseSchema } from '@terminal/env/schemas';
import { drizzle } from 'drizzle-orm/mysql2';
import { createEmailDomainsRepo } from './email-domains';
import { createOps } from './ops';
import { createTopicsRepo } from './topics';
import { createUsersRepo } from './users';

export function createDatabase(options: DatabaseSchema) {
  const db = drizzle(options.DATABASE_URL, {
    casing: 'snake_case',
  });

  return {
    db,
    emailDomains: createEmailDomainsRepo(db),
    topics: createTopicsRepo(db),
    users: createUsersRepo(db),
    ops: createOps(db),
  };
}

export { EmailDomainConflictError, EmailDomainNotFoundError } from './email-domains';
export * from './seeds';
export { TopicNotFoundError, TopicSlugConflictError } from './topics';
export * from './types';
export type Database = ReturnType<typeof createDatabase>;
