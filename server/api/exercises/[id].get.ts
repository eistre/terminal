import { EventHandlerRequest, H3Event } from 'h3'
import db from '~/prisma/db'

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  const authRequest = auth.handleRequest(event)
  const session = await authRequest.validate()

  if (!session || session.user.role === 'UNVERIFIED') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      message: 'ID not found'
    })
  }

  // @ts-ignore
  const exercise = await db.exercise.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      tasks: {
        orderBy: [{ id: 'asc' }],
        include: {
          completed_by: {
            where: {
              user_id: session.user.userId
            }
          }
        }
      }
    }
  })

  if (!exercise) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
      message: 'Exercise not found'
    })
  }

  return {
    id: exercise.id,
    title: exercise.title,
    // @ts-ignore
    tasks: exercise.tasks.map((task) => {
      return {
        id: task.id,
        title: task.title,
        content: task.content,
        hint: task.hint,
        completed: task.completed_by.length > 0
      }
    })
  }
})
