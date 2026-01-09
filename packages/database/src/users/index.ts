import type { MySql2Database } from 'drizzle-orm/mysql2';
import { createUsersAdminRepo } from './admin.js';

export function createUsersRepo(db: MySql2Database) {
  return {
    admin: createUsersAdminRepo(db),
  };
}
