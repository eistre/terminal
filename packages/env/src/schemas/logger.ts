import { z } from 'zod';

export const loggerSchema = z.object({
  LOGGER_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

export type LoggerSchema = z.infer<typeof loggerSchema>;
