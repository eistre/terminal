const logger = pino.child({ caller: 'auth' })

export default defineEventHandler(async (event) => {
  const authRequest = auth.handleRequest(event)
  const session = await authRequest.validate()
  const code = getRouterParam(event, 'code')

  if (!session || !code || session.user.role !== 'UNVERIFIED') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  try {
    const userId = session.user.userId

    await validateEmailVerificationCode(userId, code)
    await auth.invalidateAllUserSessions(userId)
    await auth.updateUserAttributes(userId, {
      role: 'USER'
    })

    await createAndSetSession(event, userId)
  } catch (error: any) {
    logger.debug(error)
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      message: error.message
    })
  }
})
