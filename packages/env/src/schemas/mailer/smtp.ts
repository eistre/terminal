import { z } from 'zod';
import { baseMailerSchema } from './base.js';

export const smtpMailerSchema = baseMailerSchema.extend({
  MAILER_TYPE: z.literal('smtp'),
  MAILER_SENDER: z.email(),
  MAILER_SMTP_HOST: z.string().min(1),
  MAILER_SMTP_PORT: z.coerce.number().int().positive().default(587),
  MAILER_SMTP_SECURE: z.stringbool().default(false),
  MAILER_SMTP_USER: z.string().optional(),
  MAILER_SMTP_PASS: z.string().optional(),
}).refine((value) => {
  return !!value.MAILER_SMTP_USER === !!value.MAILER_SMTP_PASS;
}, {
  message: 'Both MAILER_SMTP_USER and MAILER_SMTP_PASS must be provided together for authentication.',
});

export type SmtpMailerSchema = z.infer<typeof smtpMailerSchema>;
