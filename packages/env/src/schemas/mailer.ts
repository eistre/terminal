import type { AwsMailerSchema } from './mailer/aws.js';
import type { AzureMailerSchema } from './mailer/azure.js';
import type { BaseMailerSchema } from './mailer/base.js';
import type { NoopMailerSchema } from './mailer/noop.js';
import type { SmtpMailerSchema } from './mailer/smtp.js';
import { z } from 'zod';
import { awsMailerSchema } from './mailer/aws.js';
import { azureMailerSchema } from './mailer/azure.js';
import { noopMailerSchema } from './mailer/noop.js';
import { smtpMailerSchema } from './mailer/smtp.js';

export const mailerSchema = z.discriminatedUnion('MAILER_TYPE', [
  awsMailerSchema,
  azureMailerSchema,
  noopMailerSchema,
  smtpMailerSchema,
]);

export type MailerSchema = z.infer<typeof mailerSchema>;
export type { AwsMailerSchema, AzureMailerSchema, BaseMailerSchema, NoopMailerSchema, SmtpMailerSchema };
