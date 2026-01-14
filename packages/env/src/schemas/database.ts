import { z } from 'zod';

export const databaseSchema = z.object({
  DATABASE_URL: z.url({ error: 'DATABASE_URL must be a valid URL' }),
  DATABASE_SSL_ENABLED: z.coerce.boolean().default(false),
  DATABASE_SSL_CA: z.string().optional(),
});

export type DatabaseSchema = z.infer<typeof databaseSchema>;
