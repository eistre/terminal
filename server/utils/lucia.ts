// https://lucia-auth.com/getting-started/nuxt/
import { randomBytes } from 'node:crypto'
import { lucia, LuciaError } from 'lucia'
import { h3 } from 'lucia/middleware'
import { prisma } from '@lucia-auth/adapter-prisma'
import jwt from 'jsonwebtoken'
import { EventHandlerRequest, H3Event } from 'h3'
import dayjs from 'dayjs'
import db from '../../prisma/db'

const SECRET = process.env.JWT_SECRET || 'secret_example'
const CODE_EXPIRE = Number(process.env.CODE_EXPIRE) || 10
const USER_DATE_VALUE: number = Number(process.env.USER_DATE_VALUE) || 1
const USER_DATE_UNIT: dayjs.ManipulateType = process.env.USER_DATE_UNIT as dayjs.ManipulateType || 'month'

const verificationTimeout = new Map<string, { timeoutUntil: number, timeoutSeconds: number }>()

export const auth = lucia({
  env: process.env ? 'DEV' : 'PROD',
  middleware: h3(),
  adapter: prisma(db),

  getUserAttributes: ({ id, name, email, role }) => {
    return {
      name,
      email,
      role,
      // eslint-disable-next-line import/no-named-as-default-member
      token: jwt.sign({ id, role }, SECRET, { expiresIn: '6h' })
    }
  }
})

export type Auth = typeof auth

// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
export const createAndSetSession = async (event: H3Event<EventHandlerRequest>, userId: string) => {
  await auth.deleteDeadUserSessions(userId)

  const session = await auth.createSession({
    userId,
    attributes: {}
  })

  const authRequest = auth.handleRequest(event)
  authRequest.setSession(session)
}

// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
export const login = async (event: H3Event<EventHandlerRequest>, providerId: string, provider: string, password: string) => {
  try {
    const { userId } = await auth.useKey(providerId, provider.toLowerCase(), password)
    const { role } = await auth.getUser(userId)

    if (role !== 'ADMIN') {
      await auth.updateUserAttributes(userId, { expireTime: getExpireDateTime(USER_DATE_VALUE, USER_DATE_UNIT) })
    }

    await createAndSetSession(event, userId)
  } catch (error) {
    if (error instanceof LuciaError && error.message === 'AUTH_INVALID_PASSWORD') {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Incorrect password'
      })
    }

    if (error instanceof LuciaError && error.message === 'AUTH_INVALID_KEY_ID') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not found',
        message: 'User not found'
      })
    }

    pino.child({ caller: 'auth' }).error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
}

// https://lucia-auth.com/guidebook/email-verification-codes/
export const generateEmailVerificationCode = async (userId: string): Promise<string> => {
  await db.verification.deleteMany({ where: { user_id: userId } })

  const code = randomBytes(4).toString('hex').toUpperCase()

  await db.verification.create({
    data: {
      code,
      expires: dayjs().add(CODE_EXPIRE, 'minutes').unix(),
      user_id: userId
    }
  })

  return code
}

// https://lucia-auth.com/guidebook/email-verification-codes/
export const validateEmailVerificationCode = async (userId: string, code: string): Promise<string> => {
  const storedTimeout = verificationTimeout.get(userId) ?? null

  if (!storedTimeout) {
    verificationTimeout.set(userId, {
      timeoutUntil: dayjs().unix(),
      timeoutSeconds: 1
    })
  } else {
    if (dayjs().unix() < storedTimeout.timeoutUntil) {
      throw new Error('Too many requests')
    }

    const timeoutSeconds = storedTimeout.timeoutSeconds * 2
    verificationTimeout.set(userId, {
      timeoutUntil: dayjs().add(timeoutSeconds, 'seconds').unix(),
      timeoutSeconds
    })
  }

  const storedCode = await db.verification.findFirst({ where: { user_id: userId } })

  if (!storedCode || storedCode.code !== code) {
    throw new Error('Invalid code')
  }

  await db.verification.deleteMany({ where: { user_id: storedCode.user_id } })
  verificationTimeout.delete(userId)

  if (Number(storedCode.expires) < dayjs().unix()) {
    throw new Error('Expired code')
  }

  return storedCode.user_id
}
