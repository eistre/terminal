import { z } from 'zod';

export const authSchema = z.object({
  AUTH_SECRET: z.string().min(32, { error: 'AUTH_SECRET must be at least 32 characters long' }),
});

export type AuthSchema = z.infer<typeof authSchema>;
