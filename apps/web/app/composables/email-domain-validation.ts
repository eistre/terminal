import { normalizedMatchesEmailDomainRule, normalizeEmailDomain } from '#shared/email-domains-validation';

export function useEmailDomainValidation() {
  const config = useConfig();
  const { data: allowedDomainsData } = useFetch('/api/auth/email-domains', {
    method: 'GET',
    key: 'allowed-email-domains',
  });

  function isAllowedEmail(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    const adminEmail = config.value.adminEmail.trim().toLowerCase();

    if (normalized === adminEmail) {
      return true;
    }

    const at = normalized.lastIndexOf('@');
    if (at === -1) {
      return false;
    }

    const domain = normalizeEmailDomain(normalized.slice(at + 1));
    const allowedDomains = allowedDomainsData.value?.domains ?? [];
    return allowedDomains.some(d => normalizedMatchesEmailDomainRule(domain, normalizeEmailDomain(d.domain)));
  }

  return {
    isAllowedEmail,
  };
}
