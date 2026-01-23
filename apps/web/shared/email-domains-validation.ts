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

export function normalizedMatchesEmailDomainRule(normalizedDomain: string, normalizedRule: string): boolean {
  const isSuffixRule = normalizedRule.startsWith('.');
  const target = isSuffixRule ? normalizedRule.slice(1) : normalizedRule;

  if (!normalizedDomain || !target) {
    return false;
  }

  if (!isSuffixRule) {
    return normalizedDomain === target;
  }

  return normalizedDomain === target || normalizedDomain.endsWith(`.${target}`);
}

function isValidEmailDomainRule(value: string): boolean {
  // Disallow newlines and other whitespace characters that are not allowed in domain names
  if (/[\n\r\u2028\u2029]/.test(value)) {
    return false;
  }

  if (value.includes('@')
    || value === '.'
    || !value.includes('.')
    || value.endsWith('.')) {
    return false;
  }

  if (value.startsWith('.')) {
    return !value.endsWith('.')
      && value.slice(1).split('.').every(Boolean);
  }

  return value.indexOf('.') > 0
    && value.split('.').every(Boolean);
}

export const emailDomainSchema = z
  .string()
  .trim()
  .min(1)
  .transform(normalizeEmailDomain)
  .refine(isValidEmailDomainRule, { message: 'Invalid domain' });

export const upsertEmailDomainPayloadSchema = z.object({
  id: z.number().int().positive().optional(),
  domain: emailDomainSchema,
  skipVerification: z.boolean(),
});

export type UpsertEmailDomainPayload = z.infer<typeof upsertEmailDomainPayloadSchema>;
