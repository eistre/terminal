import { Server } from 'socket.io'

const socketPort = Number(process.env.SOCKET_PORT) || 3001

// Create websocket
const socket = new Server(socketPort, {
  cors: {
    origin: '*'
  }
})

export default socket
