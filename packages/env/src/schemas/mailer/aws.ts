import { z } from 'zod';
import { baseMailerSchema } from './base.js';

export const awsMailerSchema = baseMailerSchema.extend({
  MAILER_TYPE: z.literal('aws'),
  MAILER_SENDER: z.email(),
  MAILER_SES_REGION: z.string().min(1),
});

export type AwsMailerSchema = z.infer<typeof awsMailerSchema>;
