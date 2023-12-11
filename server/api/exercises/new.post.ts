import { EventHandlerRequest, H3Event } from 'h3'
import { z } from 'zod'
import db from '~/prisma/db'

const schema = z.object({
  title: z.string(),
  description: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      hint: z.string().optional(),
      regex: z.string()
    })
  ).min(1)
})

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  const authRequest = auth.handleRequest(event)
  const session = await authRequest.validate()
  const body = await readValidatedBody(event, schema.safeParse)

  if (!session || session.user.role !== 'ADMIN') {
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

  const { title, description, tasks } = body.data

  try {
    const { id } = await db.exercise.create({
      data: {
        title,
        description,
        tasks: {
          create: tasks
        }
      }
    })

    return {
      id
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
