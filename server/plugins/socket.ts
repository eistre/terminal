// https://github.com/nuxt/nuxt/pull/19230
// Modified from: https://gitlab.com/JoonasHalapuu/ubuntuterminal/-/blob/main/sshConnection.js?ref_type=heads
import { Server } from 'socket.io'
import { Client } from 'ssh2'
import jwt, { VerifyErrors } from 'jsonwebtoken'

export default defineNitroPlugin(() => {
  const logger = pino.child({ caller: 'socket' })

  const socketPort = parseInt(process.env.SOCKET_PORT ?? '3001')
  const secret = process.env.JWT_SECRET ?? 'secret_example'

  // Create websocket
  const io = new Server(socketPort, {
    cors: {
      origin: '*'
    }
  })

  logger.info(`Socket listening on port: ${socketPort}`)

  // For socket authentication
  // https://socket.io/docs/v4/middlewares/
  io.use((socket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      next(new Error('Token not provided'))
      return
    }

    // eslint-disable-next-line import/no-named-as-default-member
    jwt.verify(token, secret, (error: VerifyErrors | null, decoded: any) => {
      if (error) {
        next(new Error('Invalid token'))
        return
      }

      socket.data.client = decoded
      next()
    })
  })

  io.on('connection', async (socket) => {
    const clientId: string = socket.data.client.id
    const namespace = `ubuntu-${clientId}`

    // Create or update deployment
    try {
      await kubernetes.createOrUpdateDeployment(namespace)
    } catch (error) {
      logger.error(error)
      socket.disconnect()
    }

    const port = await kubernetes.getPort(namespace)

    // Create ssh connection
    const createPodConnection = () => {
      const client = new Client()

      client.on('ready', () => {
        logger.info(`Created ssh connection for client: ${clientId}`)
        socket.send('\r\n*** SSH Connected established ***\r\n\n')

        // TODO inotify

        client.shell((error, stream) => {
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
            client.end()
          })
        })
      })

      client.on('close', () => {
        logger.info(`Connection closed for client: ${clientId}`)
        socket.send('\r\n*** SSH Connection terminated ***\r\n')
        socket.disconnect()
      })

      client.on('error', (error) => {
        socket.send(`\r\n*** SSH Connection error: ${error.message} ***\r\n`)

        // If connection refused - try again
        if (error.message.includes('ECONNREFUSED')) {
          logger.warn(`Connection refused for client: ${clientId} - retrying`)
          createPodConnection()
        } else {
          logger.error(error)
        }
      })

      // TODO terminate socket on logout - currently socket is terminated only if client closes tab
      // TODO ssh keys
      client.connect({
        host: 'localhost',
        port,
        username: 'test',
        password: 'Test1234'
      })
    }

    createPodConnection()
  })
})
