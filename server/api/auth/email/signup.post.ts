import dayjs from 'dayjs'
import { EventHandlerRequest, H3Event } from 'h3'
import { z } from 'zod'
import { LuciaError } from 'lucia'

const RUNTIME = process.env.RUNTIME
const USER_DATE_VALUE: number = Number(process.env.USER_DATE_VALUE) || 1
const USER_DATE_UNIT:dayjs.ManipulateType = process.env.USER_DATE_UNIT as dayjs.ManipulateType || 'month'

const logger = pino.child({ caller: 'auth' })

const valid = ['@ut.ee', '@tlu.ee', '@taltech.ee', '@edu.ee']
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().refine(email => valid.some(suffix => email.endsWith(suffix))),
  password: z.string().min(8)
})

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  if (RUNTIME !== 'CLOUD') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readValidatedBody(event, schema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      message: 'Invalid request body'
    })
  }

  const { name, email, password } = body.data

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
        role: 'UNVERIFIED',
        expireTime: getExpireDateTime(USER_DATE_VALUE, USER_DATE_UNIT)
      }
    })

    await createAndSetSession(event, userId)

    const code = await generateEmailVerificationCode(userId)
    const lang = getCookie(event, 'lang') || 'ee'
    sendMail(userId, code, email, lang)
  } catch (error) {
    // In case user already exists
    if (error instanceof LuciaError && error.message === 'AUTH_DUPLICATE_KEY_ID') {
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
