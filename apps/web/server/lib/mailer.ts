import type { Locale } from '#shared/locale';
import type { MailerSchema } from '@terminal/env/schemas';
import type { Mailer } from '@terminal/mailer';
import { createMailer } from '@terminal/mailer';
import en from '~~/i18n/locales/en.json';
import et from '~~/i18n/locales/et.json';
import { useEnv } from '~~/server/lib/env';
import { useLogger } from '~~/server/lib/logger';

let _mailer: Mailer | undefined;

export function useMailer(): Mailer {
  if (!_mailer) {
    const env = useEnv();
    const logger = useLogger().child({ caller: 'mailer' });

    _mailer = createMailer(logger, env as MailerSchema);
  }

  return _mailer;
}

const messages = {
  en,
  et,
};

export function buildEmailVerificationOtpEmail(locale: Locale, otp: string): { subject: string; text: string; html: string } {
  const dict = messages[locale];

  const { subject, greeting, intro, instruction, signoff, signature } = dict.auth.emailVerification;

  const text = [greeting, intro, instruction, otp, signoff, signature].join('\n');

  const htmlBody = [
    `<p>${greeting}</p>`,
    `<p>${intro}</p>`,
    `<p>${instruction}</p>`,
    `<h3>${otp}</h3>`,
    `<p>${signoff}</p>`,
    `<p>${signature}</p>`,
  ];

  const html = `<!doctype html><html lang="${locale}"><body>${htmlBody.join('')}</body></html>`;

  return {
    subject,
    text,
    html,
  };
}
