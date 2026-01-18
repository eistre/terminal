import { z } from 'zod';

export const databaseSchema = z.object({
  DATABASE_URL: z.string().min(1, { error: 'DATABASE_URL is required' }),
  DATABASE_SSL_ENABLED: z.stringbool().default(false),
  DATABASE_SSL_CA: z.string().optional(),
});

export type DatabaseSchema = z.infer<typeof databaseSchema>;
