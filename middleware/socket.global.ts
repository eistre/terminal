export default defineNuxtRouteMiddleware(() => {
  const socket = useSocket()
  const config = useRuntimeConfig()
  const isCloud = config.public.runtime === 'CLOUD'

  if (isCloud && !socket.value) {
    createSocket()
  }
})
