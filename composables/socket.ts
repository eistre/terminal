import { type Socket } from 'socket.io-client'

export const useSocket = () => {
  return useState<Socket | null>('socket', () => null)
}
