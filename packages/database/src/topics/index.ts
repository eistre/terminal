import type { MySql2Database } from 'drizzle-orm/mysql2';
import { createTopicsAdminRepo } from './admin';
import { createTopicsCatalogRepo } from './catalog';
import { createTopicsCompletionRepo } from './completion';

export * from './errors';

export function createTopicsRepo(db: MySql2Database) {
  return {
    admin: createTopicsAdminRepo(db),
    catalog: createTopicsCatalogRepo(db),
    completion: createTopicsCompletionRepo(db),
  };
}
