import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { TopicSeed } from '../types';
import { ensureUserRole } from './admin';
import { runMigration } from './migration';
import { seedIfEmpty } from './seed';

export function createOps(db: MySql2Database) {
  return {
    ensureUserRole: async (options: { email: string; role: string }) => await ensureUserRole(db, options),
    runMigration: async (migrationsFolder: string) => await runMigration(db, { migrationsFolder }),
    seedIfEmpty: async (seeds: TopicSeed[]) => await seedIfEmpty(db, seeds),
  };
}
