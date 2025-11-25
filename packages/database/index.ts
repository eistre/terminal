import type { DatabaseSchema } from '@terminal/env';
import { drizzle } from 'drizzle-orm/mysql2';

export function createDatabase(options: DatabaseSchema) {
  return drizzle(options.DATABASE_URL, {
    casing: 'snake_case',
  });
}

export type Database = ReturnType<typeof createDatabase>;

export * from './schema';
