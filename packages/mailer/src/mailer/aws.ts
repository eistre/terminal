import type { AwsMailerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { AbstractMailer } from './abstract.js';

export class AwsMailer extends AbstractMailer {
  private readonly client: SESv2Client;
  private readonly senderAddress: string;

  constructor(logger: Logger, config: AwsMailerSchema) {
    super(logger.child({ module: 'aws' }), config);

    this.client = new SESv2Client({ region: config.MAILER_SES_REGION });
    this.senderAddress = config.MAILER_SENDER;
  }

  protected override async sendImpl(to: string, subject: string, text: string, html: string): Promise<void> {
    this.logger.debug({ to, subject }, 'Sending email via AWS');

    const response = await this.client.send(new SendEmailCommand({
      FromEmailAddress: this.senderAddress,
      Destination: {
        ToAddresses: [to],
      },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: {
            Text: { Data: text },
            Html: { Data: html },
          },
        },
      },
    }));

    this.logger.debug({ messageId: response.MessageId, to, subject }, 'Email sent via AWS');
  }
}
