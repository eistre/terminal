import dayjs from 'dayjs'
import { EventHandlerRequest, H3Event } from 'h3'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import db from '~/prisma/db'

const RUNTIME = process.env.NUXT_PUBLIC_RUNTIME
const USER_DATE_VALUE: number = Number(process.env.USER_DATE_VALUE) || 1
const USER_DATE_UNIT:dayjs.ManipulateType = process.env.USER_DATE_UNIT as dayjs.ManipulateType || 'month'

const logger = pino.child({ caller: 'auth' })

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  if (RUNTIME !== 'CLOUD') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const valid = await db.domain.findMany()
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email().refine(email => valid.some(suffix => email.endsWith(suffix.name))),
    password: z.string().min(8)
  })

  const body = await readValidatedBody(event, schema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      message: 'Invalid request body'
    })
  }

  const { name, email, password } = body.data
  const verified = valid.some(suffix => email.endsWith(suffix.name) && suffix.verified)

  try {
    const { userId } = await auth.createUser({
      key: {
        providerId: 'email',
        providerUserId: email.toLowerCase(),
        password
      },
      attributes: {
        name,
        email,
        role: verified ? 'USER' : 'UNVERIFIED',
        expireTime: getExpireDateTime(USER_DATE_VALUE, USER_DATE_UNIT)
      }
    })

    await createAndSetSession(event, userId)

    if (!verified) {
      const code = await generateEmailVerificationCode(userId)
      const lang = getCookie(event, 'lang') || 'ee'
      sendMail(userId, code, email, lang)
    }
  } catch (error) {
    // In case user already exists
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.message.includes('PRIMARY')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unauthorized',
        message: 'User already exists'
      })
    }

    logger.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
