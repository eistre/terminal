import { z } from 'zod';

export const baseMailerSchema = z.object({
  MAILER_MAX_RETRIES: z.coerce.number().int().positive().default(3),
  MAILER_CONCURRENCY_LIMIT: z.coerce.number().int().positive().default(10),
  MAILER_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(30),
});

export type BaseMailerSchema = z.infer<typeof baseMailerSchema>;
