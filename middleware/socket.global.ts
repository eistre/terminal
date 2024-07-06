export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) {
    return
  }

  const user = useUser()
  const socket = useSocket()
  const config = useRuntimeConfig()
  const isCloud = config.public.runtime === 'CLOUD'

  if (isCloud && user.value && !socket.value) {
    createSocket()
  }
})
