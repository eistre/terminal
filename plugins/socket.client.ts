import { io } from 'socket.io-client'

const port = Number(process.env.SOCKET_PORT) || 3001
const protocol = process.env.RUNTIME === 'CLOUD' ? 'wss' : 'ws'

export default defineNuxtPlugin(() => {
  const isImageReady = useImageReady()
  const socket = io(`${protocol}://${location.hostname}:${port}`)

  socket.on('image', ({ status }: { status: boolean }) => {
    isImageReady.value = status
  })
})
