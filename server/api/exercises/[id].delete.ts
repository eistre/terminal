import { EventHandlerRequest, H3Event } from 'h3'
import db from '~/prisma/db'

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  const authRequest = auth.handleRequest(event)
  const session = await authRequest.validate()
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
      message: 'Exercise if not found'
    })
  }

  try {
    // @ts-ignore
    await db.exercise.delete({
      where: {
        id: Number(id)
      }
    })
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
