import { useDatabase } from '~~/server/lib/database';

export default defineEventHandler(async () => {
  const database = useDatabase();
  const domains = await database.emailDomains.catalog.list();

  return {
    domains: domains.map(d => ({ domain: d.domain })),
  };
});
