import type { BaseMailerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import type { Mailer } from '../mailer.js';
import pLimit from 'p-limit';
import pRetry from 'p-retry';

export abstract class AbstractMailer implements Mailer {
  protected readonly logger: Logger;

  private readonly concurrencyLimit;
  private readonly maxRetries: number;
  private readonly cooldownSeconds: number;

  private readonly onHold = new Set<string>();
  private readonly holdTimers = new Map<string, ReturnType<typeof setTimeout>>();

  protected constructor(logger: Logger, config: BaseMailerSchema) {
    this.logger = logger;
    this.concurrencyLimit = pLimit(config.MAILER_CONCURRENCY_LIMIT);
    this.maxRetries = config.MAILER_MAX_RETRIES;
    this.cooldownSeconds = config.MAILER_RESEND_COOLDOWN_SECONDS;
  }

  async send(to: string, subject: string, text: string, html: string): Promise<void> {
    return this.withConcurrencyLimit(() =>
      this.withHold(to, () =>
        this.withRetry(() => this.sendImpl(to, subject, text, html))),
    );
  }

  protected abstract sendImpl(to: string, subject: string, text: string, html: string): Promise<void>;

  protected withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
    return this.concurrencyLimit(fn);
  }

  protected async withHold(key: string, fn: () => Promise<void>): Promise<void> {
    if (this.onHold.has(key)) {
      this.logger.debug({ key }, 'Email send suppressed because recipient is on hold');
      return;
    }

    this.onHold.add(key);

    try {
      await fn();

      const existingTimer = this.holdTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.onHold.delete(key);
        this.holdTimers.delete(key);
      }, this.cooldownSeconds * 1000);

      this.holdTimers.set(key, timer);
    }
    catch (error) {
      this.onHold.delete(key);

      const existingTimer = this.holdTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.holdTimers.delete(key);
      }

      throw error;
    }
  }

  protected withRetry(fn: () => Promise<void>): Promise<void> {
    return pRetry(fn, {
      retries: this.maxRetries,
      randomize: true,
    });
  }
}
