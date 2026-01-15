import { z } from 'zod';
import { baseMailerSchema } from './base.js';

export const azureMailerSchema = baseMailerSchema.extend({
  MAILER_TYPE: z.literal('azure'),
  MAILER_AZURE_CONNECTION_STRING: z.string().min(1),
  MAILER_AZURE_SENDER: z.email(),
});

export type AzureMailerSchema = z.infer<typeof azureMailerSchema>;
