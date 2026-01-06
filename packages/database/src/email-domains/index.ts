import type { MySql2Database } from 'drizzle-orm/mysql2';
import { createEmailDomainsAdminRepo } from './admin';
import { createEmailDomainsCatalogRepo } from './catalog';

export * from './errors';

export function createEmailDomainsRepo(db: MySql2Database) {
  return {
    admin: createEmailDomainsAdminRepo(db),
    catalog: createEmailDomainsCatalogRepo(db),
  };
}
