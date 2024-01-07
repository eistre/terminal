import { EventHandlerRequest, H3Event } from 'h3'
import { z } from 'zod'
import db from '~/prisma/db'

const logger = pino.child({ caller: 'exercise' })

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  tasks: z.array(
    z.object({
      id: z.number().optional(),
      title: z.string().min(1),
      content: z.string().min(1),
      hint: z.string().optional().nullable(),
      regex: z.string().min(1)
    })
  ).min(1),
  removed: z.array(z.number())
})

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  const authRequest = auth.handleRequest(event)
  const session = await authRequest.validate()
  const body = await readValidatedBody(event, schema.safeParse)
  const id = getRouterParam(event, 'id')

  if (!session || session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      message: 'ID not found'
    })
  }

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      message: 'Invalid request body'
    })
  }

  const { title, description, tasks, removed } = body.data
  const existingTasks = tasks.filter(task => task.id)
  const newTasks = tasks.filter(task => !task.id)

  try {
    const promises = []

    promises.push(
      // @ts-ignore
      db.task.deleteMany({
        where: {
          id: {
            in: removed
          }
        }
      })
    )

    for (const task of existingTasks) {
      promises.push(
        // @ts-ignore
        db.task.update({
          where: {
            id: task.id
          },
          data: {
            title: task.title,
            content: task.content,
            hint: task.hint,
            regex: task.regex
          }
        })
      )
    }

    promises.push(
      // @ts-ignore
      db.exercise.update({
        where: {
          id: Number(id)
        },
        data: {
          title,
          description,
          tasks: {
            create: newTasks
          }
        }
      })
    )

    await Promise.all(promises)
  } catch (error) {
    logger.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
