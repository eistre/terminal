import { boolean, index, int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';

export const emailDomains = mysqlTable(
  'email_domains',
  {
    id: int('id').autoincrement().primaryKey(),
    domain: varchar('domain', { length: 255 }).notNull().unique(),
    skipVerification: boolean('skip_verification').default(false).notNull(),
    createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index('email_domains_domain_idx').on(table.domain)],
);
