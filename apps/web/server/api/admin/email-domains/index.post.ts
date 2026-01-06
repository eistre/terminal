import { upsertEmailDomainPayloadSchema } from '#shared/email-domains-validation';
import { EmailDomainConflictError } from '@terminal/database';
import { requireAdmin } from '~~/server/lib/auth';
import { useDatabase } from '~~/server/lib/database';
import { useLogger } from '~~/server/lib/logger';

export default defineEventHandler(async (event) => {
  const database = useDatabase();
  const logger = useLogger();

  const userSession = await requireAdmin(event);

  const parsedPayload = upsertEmailDomainPayloadSchema.safeParse(await readBody(event));
  if (!parsedPayload.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' });
  }

  try {
    const id = await database.emailDomains.admin.upsertDomain({
      domain: parsedPayload.data.domain,
      skipVerification: parsedPayload.data.skipVerification,
    });

    logger.info({ userId: userSession.user.id, emailDomainId: id }, 'Email domain created');
    return { id };
  }
  catch (error) {
    if (error instanceof EmailDomainConflictError) {
      throw createError({ statusCode: 409, statusMessage: 'Domain already exists' });
    }

    logger.error(error, 'Failed to create email domain');
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
