import type { z } from 'zod';
import process from 'node:process';

export function loadEnv<T extends z.ZodSchema>(schema: T): z.infer<T> {
  const result = schema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error
      .issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');

    throw new Error(`Environment validation failed - ${errors}`);
  }

  return result.data;
}
