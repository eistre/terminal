// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
import { z } from 'zod'
import { LuciaError } from 'lucia'
import { EventHandlerRequest, H3Event } from 'h3'
import dayjs from 'dayjs'

const USER_DATE_VALUE: number = Number(process.env.USER_DATE_VALUE) || 1
const USER_DATE_UNIT:dayjs.ManipulateType = process.env.USER_DATE_UNIT as dayjs.ManipulateType || 'month'

const schema = z.object({
  name: z.string().min(1),
  password: z.string().min(8)
})

async function createAndSetSession (event: H3Event<EventHandlerRequest>, userId: string) {
  const session = await auth.createSession({
    userId,
    attributes: {}
  })

  const authRequest = auth.handleRequest(event)
  authRequest.setSession(session)
}

async function login (event: H3Event<EventHandlerRequest>, name: string, password: string) {
  try {
    const { userId } = await auth.useKey('name', name.toLowerCase(), password)

    await createAndSetSession(event, userId)
  } catch (error) {
    if (error instanceof LuciaError && error.message === 'AUTH_INVALID_PASSWORD') {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Incorrect password'
      })
    }

    // TODO log
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
}

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  const invalidBody = await readBody(event)
  const body = schema.safeParse(invalidBody)

  if (!body.success) {
    // TODO LOG 'Invalid login request from', getRequestIP(event, { xForwardedFor: true }), 'with body:', invalidBody

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
        expireTime: getExpireDateTime(USER_DATE_VALUE, USER_DATE_UNIT)
      }
    })

    await createAndSetSession(event, userId)
  } catch (error) {
    // if login attempt
    if (error instanceof LuciaError && error.message === 'AUTH_DUPLICATE_KEY_ID') {
      await login(event, name, password)
      return
    }

    // TODO log
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
