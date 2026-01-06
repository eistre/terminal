import { upsertEmailDomainPayloadSchema } from '#shared/email-domains-validation';
import { EmailDomainConflictError } from '@terminal/database';
import { z } from 'zod';
import { requireAdmin } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useLogger } from '~~/server/lib/logger';

const routeSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export default defineEventHandler(async (event) => {
  const database = useDatabase();
  const logger = useLogger();

  const userSession = await requireAdmin(event);

  const parsed = await getValidatedRouterParams(event, data => routeSchema.safeParse(data));
  const parsedPayload = upsertEmailDomainPayloadSchema.safeParse(await readBody(event));

  if (!parsed.success || !parsedPayload.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' });
  }

  if (parsedPayload.data.id !== undefined && parsedPayload.data.id !== parsed.data.id) {
    throw createError({ statusCode: 400, statusMessage: 'Email domain id mismatch' });
  }

  try {
    const id = await database.emailDomains.admin.upsertDomain({
      id: parsed.data.id,
      domain: parsedPayload.data.domain,
      skipVerification: parsedPayload.data.skipVerification,
    });

    logger.info({ userId: userSession.user.id, emailDomainId: id }, 'Email domain updated');
    return { id };
  }
  catch (error) {
    if (error instanceof EmailDomainConflictError) {
      throw createError({ statusCode: 409, statusMessage: 'Domain already exists' });
    }

    logger.error(error, `Failed to upsert email domain with id: ${parsed.data.id}`);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
