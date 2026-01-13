import type { MySql2Database } from 'drizzle-orm/mysql2';
import { createTopicsAdminRepo } from './admin.js';
import { createTopicsCatalogRepo } from './catalog.js';
import { createTopicsCompletionRepo } from './completion.js';

export * from './errors.js';

export function createTopicsRepo(db: MySql2Database) {
  return {
    admin: createTopicsAdminRepo(db),
    catalog: createTopicsCatalogRepo(db),
    completion: createTopicsCompletionRepo(db),
  };
}
