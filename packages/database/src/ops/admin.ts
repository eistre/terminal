import type { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq } from 'drizzle-orm';
import { users } from '../schema';

export async function ensureUserRole(db: MySql2Database, options: {
  email: string;
  role: string;
}): Promise<boolean> {
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
}
