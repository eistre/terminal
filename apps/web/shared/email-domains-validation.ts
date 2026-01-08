import { z } from 'zod';

function normalizeLeadingAt(value: string): string {
  if (value.startsWith('@')) {
    return value.slice(1);
  }

  return value;
}

export function normalizeEmailDomain(value: string): string {
  return normalizeLeadingAt(value.trim()).toLowerCase();
}

export const emailDomainSchema = z
  .string()
  .trim()
  .min(1)
  .transform(normalizeEmailDomain)
  .refine(value => !value.includes('@'), { message: 'Invalid domain' })
  .refine(value => /^[^\n\r.\u2028\u2029]+\..+$/.test(value), { message: 'Invalid domain' });

export const upsertEmailDomainPayloadSchema = z.object({
  id: z.number().int().positive().optional(),
  domain: emailDomainSchema,
  skipVerification: z.boolean(),
});

export type UpsertEmailDomainPayload = z.infer<typeof upsertEmailDomainPayloadSchema>;
