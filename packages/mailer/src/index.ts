import type { MailerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import type { Mailer } from './mailer';
import { AzureMailer } from './mailer/azure';
import { NoopMailer } from './mailer/noop';

export type { Mailer } from './mailer';

export function createMailer(
  logger: Logger,
  config: MailerSchema,
): Mailer {
  switch (config.MAILER_TYPE) {
    case 'azure':
      return new AzureMailer(logger, config);
    case 'noop':
      return new NoopMailer(logger, config);
    default:
      throw new Error(`Unsupported mailer type: ${(config as MailerSchema).MAILER_TYPE}`);
  }
}
