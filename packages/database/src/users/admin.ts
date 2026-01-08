import type { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, lt } from 'drizzle-orm';
import { users } from '../schema';

export function createUsersAdminRepo(db: MySql2Database) {
  return {
    async markUserEmailVerified(userId: string): Promise<void> {
      await db.update(users).set({ emailVerified: true }).where(eq(users.id, userId));
    },

    async ensureUserRole(options: { email: string; role: string }): Promise<boolean> {
      const [existing] = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, options.email));

      if (!existing) {
        return false;
      }

      if (existing.role === options.role) {
        return true;
      }

      await db
        .update(users)
        .set({ role: options.role })
        .where(and(
          eq(users.id, existing.id),
          eq(users.email, options.email),
        ));

      return true;
    },

    async deleteExpiredUsers(): Promise<number> {
      const result = await db.delete(users).where(lt(users.expiresAt, new Date()));
      return result[0].affectedRows;
    },
  };
}
