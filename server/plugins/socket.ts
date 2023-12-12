// https://github.com/nuxt/nuxt/pull/19230
// Modified from: https://gitlab.com/JoonasHalapuu/ubuntuterminal/-/blob/main/sshConnection.js?ref_type=heads
import { Client } from 'ssh2'
import jwt, { VerifyErrors } from 'jsonwebtoken'
import { Server, Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import db from '~/prisma/db'

const logger = pino.child({ caller: 'socket' })
const SECRET = process.env.JWT_SECRET || 'secret_example'
const SOCKET_PORT = Number(process.env.SOCKET_PORT) || 3001

async function verifyToken (socket: Socket, next: (err?: ExtendedError | undefined) => void) {
  const { token, exerciseId } = socket.handshake.auth

  if (!token) {
    next(new Error('Token not provided'))
    return
  }

  if (!exerciseId) {
    next(new Error('Exercise id not provided'))
    return
  }

  const count = await db.exercise.count({ where: { id: Number(exerciseId) } })

  if (count === 0) {
    next(new Error('Exercise not found'))
    return
  }

  // eslint-disable-next-line import/no-named-as-default-member
  jwt.verify(token, SECRET, (error: VerifyErrors | null, decoded: any) => {
    if (error) {
      next(new Error('Invalid token'))
      return
    }

    socket.data = {
      clientId: decoded.id,
      exerciseId
    }
    next()
  })
}

function waitForImage () {
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

async function connectToPod (socket: Socket, port: number) {
  const pod = new Client()

  await setProxy(socket, pod, port)

  const privateKey = await useStorage('ssh').getItem<string>(`ubuntu-${socket.data.clientId}`)

  if (!privateKey) {
    logger.error('Private key not found')
    socket.disconnect()
    return
  }

  pod.connect({
    host: 'localhost',
    port,
    username: 'test',
    privateKey
  })
}

async function setProxy (socket: Socket, pod: Client, port: number) {
  const { clientId, exerciseId } = socket.data
  const tasks = await db.task.findMany({
    where: {
      exercise_id: Number(exerciseId),
      completed_by: {
        none: {
          user_id: clientId
        }
      }
    },
    select: {
      id: true,
      regex: true
    }
  })

  pod.on('ready', () => {
    logger.info(`Created ssh connection for client: ${clientId}`)
    socket.send({ data: '\r\n*** SSH Connected established ***\r\n\n' })

    pod.exec('inotifywait /home /home/test -m', (error, channel) => {
      if (error) {
        logger.error(error)
      }

      channel.on('close', () => {
        logger.debug('inotify instance closed')
      })

      channel.on('data', (data: Buffer) => {
        evaluate(socket, data.toString('binary'), tasks)
      })

      channel.stderr.on('data', (data: Buffer) => {
        logger.debug(data.toString('binary'))
      })
    })

    pod.shell((error, stream) => {
      if (error) {
        logger.error(error)
        socket.send({ data: `\r\n*** SSH Shell error: ${error.message} ***\r\n` })
        return
      }

      socket.on('message', ({ data }: { data: string }) => {
        stream.write(data)
      })

      socket.on('disconnect', () => {
        stream.write('exit\n')
      })

      stream.on('data', (data: Buffer) => {
        evaluate(socket, data.toString('binary'), tasks)
        socket.send({ data: data.toString('binary') })
      })

      stream.on('close', () => {
        pod.end()
      })
    })
  })

  pod.on('close', () => {
    logger.info(`Connection closed for client: ${clientId}`)
    socket.send({ data: '\r\n*** SSH Connection terminated ***\r\n' })
    socket.disconnect()
  })

  pod.on('error', async (error) => {
    socket.send({ data: `\r\n*** SSH Connection error: ${error.message} ***\r\n` })

    // If connection refused - try again
    if (error.message.includes('ECONNREFUSED')) {
      logger.warn(`Connection refused for client: ${clientId} - retrying`)
      await connectToPod(socket, port)
    } else {
      logger.error(error)
    }
  })
}

async function evaluate (socket: Socket, data: string, tasks: { id: number, regex: string }[]) {
  const completed = tasks
    // eslint-disable-next-line security-node/non-literal-reg-expr
    .filter(task => new RegExp(task.regex).test(data))
    .map(task => ({ user_id: socket.data.clientId, task_id: task.id }))

  if (completed.length > 0) {
    await db.completedTask.createMany({
      data: completed,
      skipDuplicates: true
    })

    const taskIds = completed.map(task => task.task_id)

    taskIds.forEach((id) => {
      const index = tasks.findIndex(task => task.id === id)
      tasks.splice(index, 1)
    })

    socket.emit('complete', { data: taskIds })
  }
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

  client.on('connection', async (socket) => {
    await waitForImage()

    try {
      const port = await kubernetes.createOrUpdatePod(socket.data.clientId)

      // Create ssh connection
      if (!socket.disconnected) {
        socket.emit('ready')
        await connectToPod(socket, port)
      }
    } catch (error) {
      logger.error(error)
      socket.disconnect()
    }
  })
})
