import { z } from 'zod'
import { EventHandlerRequest, H3Event } from 'h3'

const RUNTIME = process.env.NUXT_PUBLIC_RUNTIME

const valid = ['@ut.ee', '@tlu.ee', '@taltech.ee', '@edu.ee']
const schema = z.object({
  email: z.string()
    .email()
    .refine(email => valid.some(suffix => email.endsWith(suffix)))
    .or(z.string().regex(/^admin$/)),
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

  const { email, password } = body.data

  if (email === 'admin') {
    await login(event, 'name', email, password)
    return
  }

  await login(event, 'email', email, password)
})
