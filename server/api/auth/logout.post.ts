// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
import { EventHandlerRequest, H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  const authRequest = auth.handleRequest(event)
  const session = await authRequest.validate()

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  await auth.invalidateSession(session.sessionId)
  authRequest.setSession(null)
})
