import type { MySql2Database } from 'drizzle-orm/mysql2';
import { lt } from 'drizzle-orm';
import { verifications } from '../schema/index.js';

export function createVerificationsAdminRepo(db: MySql2Database) {
  return {
    async deleteExpiredVerifications(): Promise<number> {
      const result = await db.delete(verifications).where(lt(verifications.expiresAt, new Date()));
      return result[0].affectedRows;
    },
  };
}
