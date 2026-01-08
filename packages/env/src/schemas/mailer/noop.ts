import { z } from 'zod';
import { baseMailerSchema } from './base';

export const noopMailerSchema = baseMailerSchema.extend({
  MAILER_TYPE: z.literal('noop'),
});

export type NoopMailerSchema = z.infer<typeof noopMailerSchema>;
