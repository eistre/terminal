import type { emailDomains } from '../../schema/index.js';

export interface EmailDomainSeed {
  domain: typeof emailDomains.$inferInsert.domain;
  skipVerification: typeof emailDomains.$inferInsert.skipVerification;
}
