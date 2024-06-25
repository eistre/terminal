import { EventHandlerRequest, H3Event } from 'h3'
import { z } from 'zod'
import db from '~/prisma/db'

const RUNTIME = process.env.NUXT_PUBLIC_RUNTIME

const schema = z.object({
  name: z.string().min(1).regex(/^.+\..+$/)
})

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  const authRequest = auth.handleRequest(event)
  const session = await authRequest.validate()
  const body = await readValidatedBody(event, schema.safeParse)

  if (RUNTIME !== 'CLOUD' || !session || session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      message: 'Invalid request body'
    })
  }

  try {
    await db.domain.delete({
      where: {
        name: body.data.name
      }
    })
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
