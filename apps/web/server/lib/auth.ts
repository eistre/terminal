import type { SocialProviders } from 'better-auth';
import type { H3Event } from 'h3';
import type { Locale } from '~~/shared/locale';
import * as schema from '@terminal/database/schema/auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { admin, emailOTP } from 'better-auth/plugins';
import { useDatabase } from '~~/server/lib/database';
import { useEnv } from '~~/server/lib/env';
import { useLogger } from '~~/server/lib/logger';
import { buildEmailVerificationOtpEmail, useMailer } from '~~/server/lib/mailer';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getEmailDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at === -1) {
    return null;
  }

  const domain = email.slice(at + 1);
  return domain.length > 0 ? domain : null;
}

let _auth: Auth | undefined;

function createAuth() {
  const env = useEnv();
  const database = useDatabase();
  const logger = useLogger().child({ caller: 'auth' });

  const isMicrosoftEnabled = Boolean(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET && env.MICROSOFT_TENANT_ID);
  const isNoopMailer = env.MAILER_TYPE === 'noop';

  const trustedProviders: string[] = ['email-password'];
  const socialProviders: SocialProviders = {};
  if (isMicrosoftEnabled) {
    trustedProviders.push('microsoft');
    socialProviders.microsoft = {
      clientId: env.MICROSOFT_CLIENT_ID!,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      tenantId: env.MICROSOFT_TENANT_ID,
      disableProfilePhoto: true,
      prompt: 'select_account',
    };
  }

  return betterAuth({
    socialProviders,
    secret: env.AUTH_SECRET,
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-up/email' && ctx.path !== '/sign-in/email') {
          return;
        }

        const email = ctx.body.email;
        if (!email) {
          return;
        }

        const normalizedEmail = normalizeEmail(email);
        if (normalizedEmail === normalizeEmail(env.ADMIN_EMAIL)) {
          return;
        }

        const domain = getEmailDomain(normalizedEmail);
        if (!domain) {
          throw new APIError('BAD_REQUEST', { message: 'Email domain is not allowed' });
        }

        const rule = await database.emailDomains.catalog.get(domain);
        if (!rule) {
          throw new APIError('BAD_REQUEST', { message: 'Email domain is not allowed' });
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-up/email') {
          return;
        }

        const returned = ctx.context.returned as { user?: { email?: string; id?: string; emailVerified?: boolean } };
        const email = returned.user?.email;
        const userId = returned.user?.id;

        if (!email || !userId) {
          return;
        }

        const normalizedEmail = normalizeEmail(email);
        if (normalizedEmail === normalizeEmail(env.ADMIN_EMAIL)) {
          return;
        }

        const domain = getEmailDomain(normalizedEmail);
        if (!domain) {
          return;
        }

        const rule = await database.emailDomains.catalog.get(domain);
        if (!rule?.skipVerification) {
          return;
        }

        await database.users.admin.markUserEmailVerified(userId);
        if (returned.user) {
          returned.user.emailVerified = true;
        }
      }),
    },
    database: drizzleAdapter(database.db, {
      provider: 'mysql',
      usePlural: true,
      transaction: true,
      schema: {
        ...schema,
      },
    }),
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if ((user as any).role === 'admin') {
              return { data: user };
            }

            const expiryMs = env.USER_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
            return {
              data: {
                ...user,
                expiresAt: new Date(Date.now() + expiryMs),
              },
            };
          },
        },
      },
      session: {
        create: {
          after: async (session, ctx) => {
            const user = await ctx?.context.internalAdapter.findUserById(session.userId);

            if (!user || (user as any).role === 'admin') {
              return;
            }

            const expiryMs = env.USER_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
            await ctx?.context.internalAdapter.updateUser(session.userId, {
              expiresAt: new Date(Date.now() + expiryMs),
            });
          },
        },
      },
    },
    emailVerification: {
      autoSignInAfterVerification: true,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: !isNoopMailer,
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders,
      },
    },
    user: {
      additionalFields: {
        expiresAt: {
          type: 'date',
          required: false,
          input: false,
        },
      },
      deleteUser: {
        enabled: true,
      },
    },
    plugins: [
      admin(),
      ...(!isNoopMailer
        ? [
            emailOTP({
              overrideDefaultEmailVerification: true,
              async sendVerificationOTP({ email, otp, type }, request) {
                if (type !== 'email-verification') {
                  return;
                }

                const normalizedEmail = normalizeEmail(email);
                if (normalizedEmail === normalizeEmail(env.ADMIN_EMAIL)) {
                  return;
                }

                const domain = getEmailDomain(normalizedEmail);
                if (!domain) {
                  return;
                }

                const rule = await database.emailDomains.catalog.get(domain);
                if (rule?.skipVerification) {
                  return;
                }

                const locale: Locale = request?.getCookie('locale') === 'en' ? 'en' : 'et';
                const { subject, text, html } = buildEmailVerificationOtpEmail(locale, otp);

                const mailer = useMailer();
                mailer.send(email, subject, text, html)
                  .catch((error) => {
                    logger.error(error, 'Failed to send email verification OTP');
                  });
              },
            }),
          ]
        : []),
    ],
    logger: {
      log: (level, message, ...args) => {
        logger[level]({ ...args }, message);
      },
    },
  });
}

export function useAuth() {
  if (!_auth) {
    _auth = createAuth();
  }

  return _auth;
}

export type Auth = ReturnType<typeof createAuth>;

export async function requireSession(event: H3Event) {
  const auth = useAuth();
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  return session;
}

export async function requireAdmin(event: H3Event) {
  const session = await requireSession(event);

  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  return session;
}
