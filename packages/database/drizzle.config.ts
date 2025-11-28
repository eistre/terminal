import { loadEnv } from '@terminal/env';
import { databaseSchema } from '@terminal/env/schemas';
import { defineConfig } from 'drizzle-kit';

const env = loadEnv(databaseSchema);

export default defineConfig({
  out: './migrations',
  schema: './src/schema',
  casing: 'snake_case',
  dialect: 'mysql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
