import type { emailDomains } from '../../schema';

export interface EmailDomainSeed {
  domain: typeof emailDomains.$inferInsert.domain;
  skipVerification: typeof emailDomains.$inferInsert.skipVerification;
}
