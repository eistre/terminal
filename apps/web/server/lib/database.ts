import type { Database } from '@terminal/database';
import type { DatabaseSchema } from '@terminal/env/schemas';
import { createDatabase } from '@terminal/database';
import { useEnv } from '~~/server/lib/env';

let _database: Database | undefined;

export function useDatabase(): Database {
  if (!_database) {
    const env = useEnv();
    _database = createDatabase(env as DatabaseSchema);
  }

  return _database;
}
