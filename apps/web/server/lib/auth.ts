import type { Database } from '@terminal/database';
import type { Logger } from '@terminal/logger';
import type {
  AuthContext,
  BetterAuthOptions,
  GenericEndpointContext,
  MiddlewareContext,
  MiddlewareOptions,
  Session,
  SocialProviders,
  User,
} from 'better-auth';
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const AUTH_PATHS = { SIGN_UP: '/sign-up/email', SIGN_IN: '/sign-in/email' };
let _auth: Auth | undefined;

type Context = MiddlewareContext<MiddlewareOptions, AuthContext<BetterAuthOptions> & {
  returned?: unknown | undefined;
  responseHeaders?: Headers | undefined;
}>;

// Helper Functions
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

function isAdminEmail(email: string): boolean {
  const env = useEnv();
  return normalizeEmail(email) === normalizeEmail(env.AUTH_ADMIN_EMAIL);
}

function calculateUserExpiry(): Date {
  const env = useEnv();
  return new Date(Date.now() + (env.AUTH_USER_EXPIRY_DAYS * MS_PER_DAY));
}

async function validateEmailDomainForAuth(email: string, database: Database): Promise<{ allowed: boolean; skipVerification: boolean }> {
  const normalizedEmail = normalizeEmail(email);

  // Admin always allowed, never skip verification
  if (isAdminEmail(normalizedEmail)) {
    return { allowed: true, skipVerification: false };
  }

  const domain = getEmailDomain(normalizedEmail);
  if (!domain) {
    return { allowed: false, skipVerification: false };
  }

  const rule = await database.emailDomains.catalog.get(domain);
  if (!rule) {
    return { allowed: false, skipVerification: false };
  }

  return {
    allowed: true,
    skipVerification: rule.skipVerification,
  };
}

async function sendVerificationEmail(email: string, otp: string, locale: Locale, logger: Logger): Promise<void> {
  const { subject, text, html } = buildEmailVerificationOtpEmail(locale, otp);
  const mailer = useMailer();

  mailer.send(email, subject, text, html)
    .catch((error) => {
      logger.error(error, 'Failed to send email verification OTP');
    });
}

// Hook Handlers
async function handleBeforeSignUpSignIn(ctx: Context, database: Database): Promise<void> {
  if (ctx.path !== AUTH_PATHS.SIGN_UP && ctx.path !== AUTH_PATHS.SIGN_IN) {
    return;
  }

  const email = ctx.body.email;
  if (!email) {
    return;
  }

  const validation = await validateEmailDomainForAuth(email, database);
  if (!validation.allowed) {
    throw new APIError('BAD_REQUEST', { message: 'Email domain is not allowed' });
  }
}

async function handleAfterSignUp(ctx: Context, database: Database): Promise<void> {
  if (ctx.path !== AUTH_PATHS.SIGN_UP) {
    return;
  }

  const returned = ctx.context.returned as { user?: { email?: string; id?: string; emailVerified?: boolean } };
  const email = returned.user?.email;
  const userId = returned.user?.id;

  if (!email || !userId) {
    return;
  }

  const validation = await validateEmailDomainForAuth(email, database);
  if (!validation.skipVerification) {
    return;
  }

  await database.users.admin.markUserEmailVerified(userId);
  if (returned.user) {
    returned.user.emailVerified = true;
  }
}

function handleUserCreate(user: User & { role?: string }): { data: User & { expiresAt?: Date } } {
  if (user.role === 'admin') {
    return { data: user };
  }

  return {
    data: {
      ...user,
      expiresAt: calculateUserExpiry(),
    },
  };
}

async function handleSessionCreate(session: Session, ctx: GenericEndpointContext<BetterAuthOptions> | null): Promise<void> {
  const user = await ctx?.context.internalAdapter.findUserById(session.userId);

  if (!user || (user as { role?: string }).role === 'admin') {
    return;
  }

  await ctx?.context.internalAdapter.updateUser(session.userId, {
    expiresAt: calculateUserExpiry(),
  });
}

async function handleSendVerificationOTP(
  { email, otp, type }: { email: string; otp: string; type: string },
  request: GenericEndpointContext | undefined,
  database: Database,
  logger: Logger,
): Promise<void> {
  if (type !== 'email-verification') {
    return;
  }

  const validation = await validateEmailDomainForAuth(email, database);
  if (!validation.allowed || validation.skipVerification) {
    return;
  }

  const locale: Locale = request?.getCookie('locale') === 'en' ? 'en' : 'et';
  await sendVerificationEmail(email, otp, locale, logger);
}

function createAuth() {
  const env = useEnv();
  const database = useDatabase();
  const logger = useLogger().child({ caller: 'auth' });

  const isNoopMailer = env.MAILER_TYPE === 'noop';

  const trustedProviders: string[] = ['email-password'];
  const socialProviders: SocialProviders = {};
  if (env.AUTH_MICROSOFT_CLIENT_ID) {
    trustedProviders.push('microsoft');
    socialProviders.microsoft = {
      clientId: env.AUTH_MICROSOFT_CLIENT_ID!,
      clientSecret: env.AUTH_MICROSOFT_CLIENT_SECRET,
      tenantId: env.AUTH_MICROSOFT_TENANT_ID,
      disableProfilePhoto: true,
      prompt: 'select_account',
    };
  }

  return betterAuth({
    socialProviders,
    secret: env.AUTH_SECRET,
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        await handleBeforeSignUpSignIn(ctx, database);
      }),
      after: createAuthMiddleware(async (ctx) => {
        await handleAfterSignUp(ctx, database);
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
          before: async user => handleUserCreate(user),
        },
      },
      session: {
        create: {
          after: async (session, ctx) => {
            await handleSessionCreate(session, ctx);
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
              async sendVerificationOTP(params, request) {
                await handleSendVerificationOTP(params, request, database, logger);
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
