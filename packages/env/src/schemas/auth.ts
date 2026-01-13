import { z } from 'zod';

export const authSchema = z.object({
  AUTH_SECRET: z.string().min(32, { error: 'AUTH_SECRET must be at least 32 characters long' }),

  AUTH_USER_EXPIRY_DAYS: z.coerce.number().int().min(1).default(90),

  // Microsoft OAuth - all fields required together, or none
  AUTH_MICROSOFT_CLIENT_ID: z.string().min(1).optional(),
  AUTH_MICROSOFT_CLIENT_SECRET: z.string().min(1).optional(),
  AUTH_MICROSOFT_TENANT_ID: z.string().min(1).optional(),
  AUTH_MICROSOFT_LABEL_EN: z.string().min(1).optional(),
  AUTH_MICROSOFT_LABEL_ET: z.string().min(1).optional(),

  AUTH_ADMIN_EMAIL: z.email().default('admin@admin.sec'),
  AUTH_ADMIN_PASSWORD: z.string().min(8).default('terminal_password'),
}).refine((data) => {
  const microsoftFields = [
    data.AUTH_MICROSOFT_CLIENT_ID,
    data.AUTH_MICROSOFT_CLIENT_SECRET,
    data.AUTH_MICROSOFT_TENANT_ID,
    data.AUTH_MICROSOFT_LABEL_EN,
    data.AUTH_MICROSOFT_LABEL_ET,
  ];

  const definedFields = microsoftFields.filter(f => f !== undefined);

  // All or nothing
  return definedFields.length === 0 || definedFields.length === 5;
}, { error: 'Microsoft OAuth fields must be all defined or none defined' });

export type AuthSchema = z.infer<typeof authSchema>;
