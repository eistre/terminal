import dayjs from 'dayjs'
import { EventHandlerRequest, H3Event } from 'h3'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const RUNTIME = process.env.NUXT_PUBLIC_RUNTIME
const USER_DATE_VALUE: number = Number(process.env.USER_DATE_VALUE) || 1
const USER_DATE_UNIT:dayjs.ManipulateType = process.env.USER_DATE_UNIT as dayjs.ManipulateType || 'month'

const logger = pino.child({ caller: 'auth' })

const schema = z.object({
  name: z.string().min(1),
  password: z.string().min(8)
})

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  if (RUNTIME === 'CLOUD') {
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

  const { name, password } = body.data

  try {
    const { userId } = await auth.createUser({
      key: {
        providerId: 'name',
        providerUserId: name.toLowerCase(),
        password
      },
      attributes: {
        name,
        role: 'USER',
        expireTime: getExpireDateTime(USER_DATE_VALUE, USER_DATE_UNIT)
      }
    })

    await createAndSetSession(event, userId)
  } catch (error) {
    // In case user already exists
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.message.includes('Unique constraint')) {
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
