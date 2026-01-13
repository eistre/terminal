import type { MySql2Database } from 'drizzle-orm/mysql2';
import { createVerificationsAdminRepo } from './admin.js';

export function createVerificationsRepo(db: MySql2Database) {
  return {
    admin: createVerificationsAdminRepo(db),
  };
}
