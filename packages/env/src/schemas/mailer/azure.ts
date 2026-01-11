import { z } from 'zod';
import { baseMailerSchema } from './base.js';

export const azureMailerSchema = baseMailerSchema.extend({
  MAILER_TYPE: z.literal('azure'),
  MAILER_AZURE_CONNECTION_STRING: z.string(),
  MAILER_AZURE_SENDER: z.string(),
});

export type AzureMailerSchema = z.infer<typeof azureMailerSchema>;
