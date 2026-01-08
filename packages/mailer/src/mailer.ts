export interface Mailer {
  send: (to: string, subject: string, text: string, html: string) => Promise<void>;
}
