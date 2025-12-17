import type { MySql2Database } from 'drizzle-orm/mysql2';
import { createTopicsManageRepo } from './manage';
import { createTopicsReadRepo } from './read';

export function createTopicsRepo(db: MySql2Database) {
  return {
    read: createTopicsReadRepo(db),
    manage: createTopicsManageRepo(db),
  };
}
