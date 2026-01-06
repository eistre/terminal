import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { EmailDomainSeed } from '../types';
import { emailDomains } from '../schema';

export async function seedEmailDomainsIfEmpty(db: MySql2Database, seeds: EmailDomainSeed[]): Promise<boolean> {
  const count = await db.$count(emailDomains);
  if (count > 0) {
    return false;
  }

  await db.insert(emailDomains).values(seeds);
  return true;
}
