import { io } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  const isImageReady = useImageReady()
  const socket = io()

  socket.on('image', ({ status }: { status: boolean }) => {
    isImageReady.value = status
  })
})
