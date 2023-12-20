import { io } from 'socket.io-client'

const port = Number(process.env.SOCKET_PORT) || 3001

export default defineNuxtPlugin(() => {
  const isImageReady = useImageReady()
  const socket = io(`${location.hostname}:${port}`)

  socket.on('image', ({ status }: { status: boolean }) => {
    isImageReady.value = status
  })
})
