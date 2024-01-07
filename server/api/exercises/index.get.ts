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

  // @ts-ignore
  const exercises = await db.exercise.findMany({
    orderBy: [{ id: 'asc' }],
    include: {
      tasks: {
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

  // @ts-ignore
  return exercises.map((exercise) => {
    const tasks = exercise.tasks.length
    const completed = exercise
      .tasks
      // @ts-ignore
      .reduce((acc, task) => acc + task.completed_by.length, 0)

    return {
      id: exercise.id,
      title: exercise.title,
      description: exercise.description,
      tasks,
      progress: Math.round((completed / tasks) * 100) || 0
    }
  })
})
