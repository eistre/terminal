import type { EmailMessage } from '@azure/communication-email';
import type { AzureMailerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import { EmailClient } from '@azure/communication-email';
import { AbstractMailer } from './abstract';

export class AzureMailer extends AbstractMailer {
  private readonly client: EmailClient;
  private readonly senderAddress: string;

  constructor(logger: Logger, config: AzureMailerSchema) {
    super(logger.child({ module: 'azure' }), config);

    this.client = new EmailClient(config.AZURE_CONNECTION_STRING);
    this.senderAddress = config.AZURE_SENDER;
  }

  protected override async sendImpl(to: string, subject: string, text: string, html: string): Promise<void> {
    const message: EmailMessage = {
      senderAddress: this.senderAddress,
      content: {
        subject,
        plainText: text,
        html,
      },
      recipients: {
        to: [{ address: to }],
      },
    };

    this.logger.debug({ to, subject }, 'Sending email via Azure');

    const poller = await this.client.beginSend(message);
    const response = await poller.pollUntilDone();

    this.logger.debug({ operationId: response.id, to, subject }, 'Email sent via Azure');
  }
}
