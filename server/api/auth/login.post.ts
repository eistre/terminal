import { z } from 'zod'
import { EventHandlerRequest, H3Event } from 'h3'

const RUNTIME = process.env.NUXT_PUBLIC_RUNTIME

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

  await login(event, 'name', name, password)
})
