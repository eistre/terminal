import type { AzureMailerSchema } from './mailer/azure';
import type { BaseMailerSchema } from './mailer/base';
import type { NoopMailerSchema } from './mailer/noop';
import { z } from 'zod';
import { azureMailerSchema } from './mailer/azure';
import { noopMailerSchema } from './mailer/noop';

export const mailerSchema = z.discriminatedUnion('MAILER_TYPE', [
  azureMailerSchema,
  noopMailerSchema,
]);

export type MailerSchema = z.infer<typeof mailerSchema>;
export type { AzureMailerSchema, BaseMailerSchema, NoopMailerSchema };
