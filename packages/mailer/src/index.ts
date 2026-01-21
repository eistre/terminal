import type { MailerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import type { Mailer } from './mailer.js';
import { AwsMailer } from './mailer/aws.js';
import { AzureMailer } from './mailer/azure.js';
import { NoopMailer } from './mailer/noop.js';
import { SmtpMailer } from './mailer/smtp.js';

export type { Mailer } from './mailer.js';

export function createMailer(
  logger: Logger,
  config: MailerSchema,
): Mailer {
  switch (config.MAILER_TYPE) {
    case 'aws':
      return new AwsMailer(logger, config);
    case 'azure':
      return new AzureMailer(logger, config);
    case 'smtp':
      return new SmtpMailer(logger, config);
    case 'noop':
      return new NoopMailer(logger, config);
    default:
      throw new Error(`Unsupported mailer type: ${(config as MailerSchema).MAILER_TYPE}`);
  }
}
