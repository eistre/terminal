import { type Socket } from 'socket.io-client'

export const useStatusSocket = () => {
  return useState<Socket | null>('socket', () => null)
}

export const useTerminalSocket = () => {
  return useState<Socket | null>('terminalSocket', () => null)
}
