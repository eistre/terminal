// https://github.com/nuxt/nuxt/pull/19230
// Modified from: https://gitlab.com/JoonasHalapuu/ubuntuterminal/-/blob/main/sshConnection.js?ref_type=heads
import { Client } from 'ssh2'
import jwt, { VerifyErrors } from 'jsonwebtoken'
import { Server, Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'

const logger = pino.child({ caller: 'socket' })
const SECRET = process.env.JWT_SECRET || 'secret_example'
const SOCKET_PORT = Number(process.env.SOCKET_PORT) || 3001

function verifyToken (socket: Socket, next: (err?: ExtendedError | undefined) => void) {
  const token = socket.handshake.auth.token

  if (!token) {
    next(new Error('Token not provided'))
    return
  }

  // eslint-disable-next-line import/no-named-as-default-member
  jwt.verify(token, SECRET, (error: VerifyErrors | null, decoded: any) => {
    if (error) {
      next(new Error('Invalid token'))
      return
    }

    socket.data.client = decoded
    next()
  })
}

function waitForImageReady () {
  return new Promise<void>((resolve) => {
    if (docker.isImageReady) {
      resolve()
    }

    const listener = () => {
      if (docker.isImageReady) {
        resolve()
        emitter.off('image', listener)
      }
    }

    emitter.on('image', listener)
  })
}

async function handleClientConnection (socket: Socket) {
  const clientId: string = socket.data.client.id
  const namespace = `ubuntu-${clientId}`

  await waitForImageReady()
  await createAndConnect(socket, namespace, clientId)
}

async function createAndConnect (socket: Socket, namespace: string, clientId: string) {
  // Create or update deployment
  try {
    await kubernetes.createOrUpdateDeployment(namespace)
  } catch (error) {
    logger.error(error)
    socket.disconnect()
  }

  const port = await kubernetes.getPort(namespace)

  // Create ssh connection
  if (!socket.disconnected) {
    socket.emit('ready')
    connectPod(socket, port, clientId)
  }
}

function connectPod (socket: Socket, port: number, clientId: string) {
  const pod = new Client()

  handleProxy(socket, pod, port, clientId)

  // TODO ssh keys
  pod.connect({
    host: 'localhost',
    port,
    username: 'test',
    password: 'Test1234'
  })
}

function handleProxy (socket: Socket, pod: Client, port: number, clientId: string) {
  pod.on('ready', () => {
    logger.info(`Created ssh connection for client: ${clientId}`)
    socket.send('\r\n*** SSH Connected established ***\r\n\n')

    // TODO inotify

    pod.shell((error, stream) => {
      if (error) {
        logger.error(error)
        socket.send(`\r\n*** SSH Shell error: ${error.message} ***\r\n`)
        return
      }

      socket.on('message', (data: string) => {
        stream.write(data)
      })

      socket.on('disconnect', () => {
        stream.write('exit\n')
      })

      stream.on('data', (data: Buffer) => {
        socket.send(data.toString('binary'))
      })

      stream.on('close', () => {
        pod.end()
      })
    })
  })

  pod.on('close', () => {
    logger.info(`Connection closed for client: ${clientId}`)
    socket.send('\r\n*** SSH Connection terminated ***\r\n')
    socket.disconnect()
  })

  pod.on('error', (error) => {
    socket.send(`\r\n*** SSH Connection error: ${error.message} ***\r\n`)

    // If connection refused - try again
    if (error.message.includes('ECONNREFUSED')) {
      logger.warn(`Connection refused for client: ${clientId} - retrying`)
      connectPod(socket, port, clientId)
    } else {
      logger.error(error)
    }
  })
}

export default defineNitroPlugin(() => {
  // Create websocket
  const socket = new Server(SOCKET_PORT, {
    cors: {
      origin: '*'
    }
  })

  socket.on('connection', (socket) => {
    socket.emit('image', { status: docker.isImageReady })
  })

  emitter.on('image', () => {
    socket.emit('image', { status: docker.isImageReady })
  })

  // For socket authentication
  // https://socket.io/docs/v4/middlewares/
  const client = socket.of('terminal')
  client.use(verifyToken)

  client.on('connection', handleClientConnection)
})
