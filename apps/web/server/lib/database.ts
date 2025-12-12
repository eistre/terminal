import type { Database } from '@terminal/database';
import type { DatabaseSchema } from '@terminal/env/schemas';
import { createDatabase } from '@terminal/database';
import { useEnv } from '~~/server/lib/env';

let _db: Database | undefined;

export function useDatabase(): Database {
  if (!_db) {
    const env = useEnv();
    _db = createDatabase(env as DatabaseSchema);
  }

  return _db;
}
