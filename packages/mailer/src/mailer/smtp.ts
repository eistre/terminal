import type { SmtpMailerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import type { Transporter } from 'nodemailer';
import { createTransport } from 'nodemailer';
import { AbstractMailer } from './abstract.js';

export class SmtpMailer extends AbstractMailer {
  private readonly transporter: Transporter;
  private readonly senderAddress: string;

  constructor(logger: Logger, config: SmtpMailerSchema) {
    super(logger.child({ module: 'smtp' }), config);

    let auth: { user: string; pass: string } | undefined;
    if (config.MAILER_SMTP_USER && config.MAILER_SMTP_PASS) {
      auth = {
        user: config.MAILER_SMTP_USER,
        pass: config.MAILER_SMTP_PASS,
      };
    }

    this.senderAddress = config.MAILER_SENDER;
    this.transporter = createTransport({
      host: config.MAILER_SMTP_HOST,
      port: config.MAILER_SMTP_PORT,
      secure: config.MAILER_SMTP_SECURE,
      auth,
    });
  }

  protected override async sendImpl(to: string, subject: string, text: string, html: string): Promise<void> {
    this.logger.debug({ to, subject }, 'Sending email via SMTP');

    const response = await this.transporter.sendMail({
      from: this.senderAddress,
      to,
      subject,
      text,
      html,
    });

    this.logger.debug({ messageId: response.messageId, to, subject }, 'Email sent via SMTP');
  }
}
