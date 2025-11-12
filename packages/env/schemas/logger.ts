import { z } from 'zod';

export const loggerSchema = z.object({
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

export type LoggerSchema = z.infer<typeof loggerSchema>;
