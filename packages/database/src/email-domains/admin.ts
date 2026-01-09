import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { UpsertEmailDomainInput, UpsertEmailDomainResult } from '../types/index.js';
import { eq } from 'drizzle-orm';
import { emailDomains } from '../schema/index.js';
import { EmailDomainConflictError } from './errors.js';

interface Error {
  cause?: {
    code?: string;
    message?: string;
  };
}

export function createEmailDomainsAdminRepo(db: MySql2Database) {
  return {
    async upsertDomain(input: UpsertEmailDomainInput): Promise<UpsertEmailDomainResult> {
      try {
        const id = await (async () => {
          if (input.id) {
            await db
              .update(emailDomains)
              .set({ domain: input.domain, skipVerification: input.skipVerification })
              .where(eq(emailDomains.id, input.id));

            return input.id;
          }

          const [inserted] = await db
            .insert(emailDomains)
            .values({ domain: input.domain, skipVerification: input.skipVerification })
            .$returningId();

          if (!inserted) {
            throw new Error('Email domain not created');
          }

          return inserted.id;
        })();

        return { id };
      }
      catch (error) {
        if (
          (error as Error)?.cause?.code === 'ER_DUP_ENTRY'
          && (error as Error)?.cause?.message?.includes('email_domains.email_domains_domain_unique')
        ) {
          throw new EmailDomainConflictError();
        }

        throw error;
      }
    },

    async deleteDomain(id: number): Promise<void> {
      await db.delete(emailDomains).where(eq(emailDomains.id, id));
    },
  };
}
