import { io } from 'socket.io-client'

const port = Number(process.env.SOCKET_PORT) || 3001

export default defineNuxtPlugin(() => {
  const socket = io(`localhost:${port}`)

  return {
    provide: {
      socket
    }
  }
})
