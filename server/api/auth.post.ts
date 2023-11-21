// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
import { z } from 'zod'
import { LuciaError } from 'lucia'
import { EventHandlerRequest, H3Event } from 'h3'

const schema = z.object({
  name: z.string().min(1),
  password: z.string().min(8)
})

const createAndSetSession = async (event: H3Event<EventHandlerRequest>, userId: string) => {
  const session = await auth.createSession({
    userId,
    attributes: {}
  })

  const authRequest = auth.handleRequest(event)
  authRequest.setSession(session)
}

const login = async (event: H3Event<EventHandlerRequest>, name: string, password: string) => {
  try {
    const { userId } = await auth.useKey('name', name.toLowerCase(), password)

    await createAndSetSession(event, userId)
  } catch (e) {
    if (e instanceof LuciaError && e.message === 'AUTH_INVALID_PASSWORD') {
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
        name
      }
    })

    await createAndSetSession(event, userId)
  } catch (e) {
    // if login attempt
    if (e instanceof LuciaError && e.message === 'AUTH_DUPLICATE_KEY_ID') {
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
