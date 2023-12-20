import { EventHandlerRequest, H3Event } from 'h3'

const logger = pino.child({ caller: 'auth' })

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  const authRequest = auth.handleRequest(event)
  const session = await authRequest.validate()

  if (!session || session.user.role !== 'UNVERIFIED') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const { userId, email } = session.user

  if (codeSent.has(userId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      message: 'Too many code requests'
    })
  }

  try {
    const code = await generateEmailVerificationCode(userId)
    const lang = getCookie(event, 'lang') || 'ee'
    sendMail(userId, code, email!, lang)
  } catch (error: any) {
    logger.debug(error)
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      message: error.message
    })
  }
})
