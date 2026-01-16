import type { AzureMailerSchema } from './mailer/azure.js';
import type { BaseMailerSchema } from './mailer/base.js';
import type { NoopMailerSchema } from './mailer/noop.js';
import type { SmtpMailerSchema } from './mailer/smtp.js';
import { z } from 'zod';
import { azureMailerSchema } from './mailer/azure.js';
import { noopMailerSchema } from './mailer/noop.js';
import { smtpMailerSchema } from './mailer/smtp.js';

export const mailerSchema = z.discriminatedUnion('MAILER_TYPE', [
  azureMailerSchema,
  noopMailerSchema,
  smtpMailerSchema,
]);

export type MailerSchema = z.infer<typeof mailerSchema>;
export type { AzureMailerSchema, BaseMailerSchema, NoopMailerSchema, SmtpMailerSchema };
