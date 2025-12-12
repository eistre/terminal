import type { Database } from './index';
import { migrate } from 'drizzle-orm/mysql2/migrator';

export async function runMigration(db: Database, migrationsPath: string) {
  await migrate(db, { migrationsFolder: migrationsPath });
}
