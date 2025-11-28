import { z } from 'zod';

export const databaseSchema = z.object({
  DATABASE_URL: z.url({ error: 'DATABASE_URL must be a valid URL' }),
});

export type DatabaseSchema = z.infer<typeof databaseSchema>;
