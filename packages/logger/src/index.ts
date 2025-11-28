import type { LoggerSchema } from '@terminal/env/schemas';
import { pino } from 'pino';

export function createLogger(options: { name: string } & LoggerSchema) {
  const isDevelopment = options.NODE_ENV === 'development';

  return pino({
    name: options.name,
    level: options.LOG_LEVEL,
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
        }
      : undefined,
  });
}

export type Logger = ReturnType<typeof createLogger>;
