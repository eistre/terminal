// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
import { z } from 'zod'
import { EventHandlerRequest, H3Error, H3Event } from 'h3'
import dayjs from 'dayjs'

const RUNTIME = process.env.NUXT_PUBLIC_RUNTIME
const USER_DATE_VALUE: number = Number(process.env.USER_DATE_VALUE) || 1
const USER_DATE_UNIT:dayjs.ManipulateType = process.env.USER_DATE_UNIT as dayjs.ManipulateType || 'month'

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
    await login(event, 'name', name, password)
  } catch (error) {
    if (error instanceof H3Error && error.message === 'User not found') {
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
      return
    }

    throw error
  }
})
