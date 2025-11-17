import { databaseSchema, loadEnv } from '@terminal/env';
import { defineConfig } from 'drizzle-kit';

const env = loadEnv(databaseSchema);

export default defineConfig({
  out: './migrations',
  schema: './schema',
  casing: 'snake_case',
  dialect: 'mysql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
