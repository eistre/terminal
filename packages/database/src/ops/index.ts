import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { EmailDomainSeed, TopicSeed } from '../types/index.js';
import { runMigration } from './migration.js';
import { seedEmailDomainsIfEmpty } from './seed-email-domains.js';
import { seedTopicsIfEmpty } from './seed-topics.js';

export function createOps(db: MySql2Database) {
  return {
    runMigration: async (migrationsFolder: string) => await runMigration(db, { migrationsFolder }),
    seedEmailDomainsIfEmpty: async (seeds: EmailDomainSeed[]) => await seedEmailDomainsIfEmpty(db, seeds),
    seedTopicsIfEmpty: async (seeds: TopicSeed[]) => await seedTopicsIfEmpty(db, seeds),
  };
}
