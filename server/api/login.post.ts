// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
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

  try {
    const { name, password } = body.data

    const user = await auth.createUser({
      key: {
        providerId: 'name',
        providerUserId: name.toLowerCase(),
        password
      },
      attributes: {
        name
      }
    })

    const session = await auth.createSession({
      userId: user.userId,
      attributes: {}
    })

    const authRequest = auth.handleRequest(event)
    authRequest.setSession(session)

    // TODO log
    setResponseStatus(event, 200)
  } catch (e) {
    // TODO log

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
