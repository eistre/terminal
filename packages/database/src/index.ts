import type { DatabaseSchema } from '@terminal/env/schemas';
import { drizzle } from 'drizzle-orm/mysql2';
import { createOps } from './ops';
import { createTopicsRepo } from './topics';

export function createDatabase(options: DatabaseSchema) {
  const db = drizzle(options.DATABASE_URL, {
    casing: 'snake_case',
  });

  return {
    db,
    topics: createTopicsRepo(db),
    ops: createOps(db),
  };
}

export * from './seeds';
export * from './types';
export type Database = ReturnType<typeof createDatabase>;
