import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { UpsertEmailDomainInput, UpsertEmailDomainResult } from '../types';
import { eq } from 'drizzle-orm';
import { emailDomains } from '../schema';
import { EmailDomainConflictError } from './errors';

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
          (error as { cause?: { code?: string } })?.cause?.code === 'ER_DUP_ENTRY'
          && (error as { cause?: { message?: string } })?.cause?.message?.includes('email_domains.email_domains_domain_unique')
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
