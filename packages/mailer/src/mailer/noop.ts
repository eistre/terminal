import type { BaseMailerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import { AbstractMailer } from './abstract';

export class NoopMailer extends AbstractMailer {
  constructor(logger: Logger, config: BaseMailerSchema) {
    super(logger.child({ module: 'noop' }), config);
  }

  protected override async sendImpl(to: string, _subject: string, _text: string, _html: string): Promise<void> {
    this.logger.debug({ to }, 'Skipping email send because MAILER_TYPE=noop');
  }
}
