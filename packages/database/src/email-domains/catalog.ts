import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { EmailDomain } from '../types/index.js';
import { emailDomains } from '../schema/index.js';

export function createEmailDomainsCatalogRepo(db: MySql2Database) {
  return {
    async list(): Promise<EmailDomain[]> {
      return db
        .select({
          id: emailDomains.id,
          domain: emailDomains.domain,
          skipVerification: emailDomains.skipVerification,
          createdAt: emailDomains.createdAt,
          updatedAt: emailDomains.updatedAt,
        })
        .from(emailDomains);
    },
  };
}
