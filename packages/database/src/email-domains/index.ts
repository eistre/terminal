import type { MySql2Database } from 'drizzle-orm/mysql2';
import { createEmailDomainsAdminRepo } from './admin.js';
import { createEmailDomainsCatalogRepo } from './catalog.js';

export * from './errors.js';

export function createEmailDomainsRepo(db: MySql2Database) {
  return {
    admin: createEmailDomainsAdminRepo(db),
    catalog: createEmailDomainsCatalogRepo(db),
  };
}
