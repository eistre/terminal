import type { LoggerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import { createLogger } from '@terminal/logger';
import { useEnv } from '~~/server/lib/env';

let _logger: Logger | undefined;

export function useLogger(): Logger {
  if (!_logger) {
    const env = useEnv();

    _logger = createLogger({
      name: 'nuxt',
      ...env as LoggerSchema,
    });
  }

  return _logger;
}
