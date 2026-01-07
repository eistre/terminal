import { z } from 'zod';

export const authSchema = z.object({
  AUTH_SECRET: z.string().min(32, { error: 'AUTH_SECRET must be at least 32 characters long' }),

  USER_EXPIRY_DAYS: z.coerce.number().int().min(1).default(90),

  MICROSOFT_CLIENT_NAME: z.string().min(1).default('Microsoft'),
  MICROSOFT_CLIENT_ID: z.string().min(1).optional(),
  MICROSOFT_CLIENT_SECRET: z.string().min(1).optional(),
  MICROSOFT_TENANT_ID: z.string().min(1).optional(),

  ADMIN_EMAIL: z.email().default('admin@admin.sec'),
  ADMIN_PASSWORD: z.string().min(8).default('terminal_password'),
});

export type AuthSchema = z.infer<typeof authSchema>;
