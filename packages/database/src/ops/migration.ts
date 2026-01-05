import type { MySql2Database } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';

export async function runMigration(db: MySql2Database, { migrationsFolder}: {
  migrationsFolder: string;
}): Promise<void> {
  await migrate(db, { migrationsFolder });
}
