import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { EmailDomain } from '../types/index.js';
import { eq } from 'drizzle-orm';
import { emailDomains } from '../schema/index.js';
import { EmailDomainNotFoundError } from './errors.js';

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

    async get(domain: string): Promise<EmailDomain> {
      const [row] = await db
        .select({
          id: emailDomains.id,
          domain: emailDomains.domain,
          skipVerification: emailDomains.skipVerification,
          createdAt: emailDomains.createdAt,
          updatedAt: emailDomains.updatedAt,
        })
        .from(emailDomains)
        .where(eq(emailDomains.domain, domain));

      if (!row) {
        throw new EmailDomainNotFoundError();
      }

      return row;
    },
  };
}
