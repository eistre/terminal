import type { AzureMailerSchema } from './mailer/azure.ts';
import type { BaseMailerSchema } from './mailer/base.ts';
import type { NoopMailerSchema } from './mailer/noop.ts';
import { z } from 'zod';
import { azureMailerSchema } from './mailer/azure.ts';
import { noopMailerSchema } from './mailer/noop.ts';

export const mailerSchema = z.discriminatedUnion('MAILER_TYPE', [
  azureMailerSchema,
  noopMailerSchema,
]);

export type MailerSchema = z.infer<typeof mailerSchema>;
export type { AzureMailerSchema, BaseMailerSchema, NoopMailerSchema };
