// https://github.com/nuxt/nuxt/pull/19230
// Modified from: https://gitlab.com/JoonasHalapuu/ubuntuterminal/-/blob/main/sshConnection.js?ref_type=heads
import { Client } from 'ssh2'
import jwt, { type VerifyErrors } from 'jsonwebtoken'
import { type Server, Socket } from 'socket.io'
import type { ExtendedError } from 'socket.io/dist/namespace'
import db from '~/prisma/db'

const logger = pino.child({ caller: 'socket' })
const SECRET = process.env.JWT_SECRET || 'secret_example'

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

  // @ts-ignore
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

    if (!decoded.role || decoded.role === 'UNVERIFIED') {
      next(new Error('Unauthorized'))
      return
    }

    socket.data = {
      clientId: decoded.id,
      exerciseId
    }
    next()
  })
}

async function connectToPod (socket: Socket, connection: { ip: string, port: number }) {
  const pod = new Client()

  await setProxy(socket, pod, connection)

  const privateKey = await useStorage('ssh').getItem<string>(`ubuntu-${socket.data.clientId}`)

  if (!privateKey) {
    logger.error('Private key not found')
    socket.disconnect()
    return
  }

  pod.connect({
    host: connection.ip,
    port: connection.port,
    username: 'user',
    privateKey
  })
}

async function setProxy (socket: Socket, pod: Client, connection: { ip: string, port: number }) {
  const { clientId, exerciseId } = socket.data
  // @ts-ignore
  let tasks = await db.task.findMany({
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

  socket.on('reset_exercise', async () => {
    try {
      logger.debug(`Resetting exercise ${exerciseId} for client ${clientId}`)

      // @ts-ignore
      const ids = await db.task.findMany({ where: { exercise_id: Number(exerciseId) }, select: { id: true } })
      // @ts-ignore
      await db.completedTask.deleteMany({ where: { user_id: clientId, task_id: { in: ids.map(id => id.id) } } })

      // @ts-ignore
      tasks = await db.task.findMany({
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

      socket.emit('reset_exercise', { status: true })
    } catch (error) {
      logger.error(error)
      socket.emit('reset_exercise', { status: false })
    }
  })

  pod.on('ready', () => {
    logger.info(`Created ssh connection for client: ${clientId}`)
    socket.send({ data: '\r\n*** SSH Connected established ***\r\n\n' })
    socket.emit('ready')

    pod.exec('inotifywait /home /home/user -m', (error, channel) => {
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

      socket.on('resize', ({ rows, cols, height, width }: { rows: number, cols: number, height: number, width: number }) => {
        stream.setWindow(rows, cols, height, width)
      })

      socket.on('reset_pod', async () => {
        stream.write('exit\n')
        logger.debug(`Resetting pod for client ${clientId}`)
        await kubernetes.deleteNamespace(`ubuntu-${clientId}`)
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
      await connectToPod(socket, connection)
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
    // @ts-ignore
    await db.completedTask.createMany({
      data: completed
    })

    const taskIds = completed.map(task => task.task_id)

    taskIds.forEach((id) => {
      const index = tasks.findIndex(task => task.id === id)
      tasks.splice(index, 1)
    })

    socket.emit('complete', { data: taskIds })
  }
}

export default function handleSocket (server: Server) {
  // For socket authentication
  // https://socket.io/docs/v4/middlewares/
  server.use(verifyToken)

  server.on('connection', async (socket) => {
    try {
      socket.send({ data: '\r\n*** Starting Ubuntu pod ***\r\n' })
      const connection = await kubernetes.createOrUpdatePod(socket.data.clientId)

      // Create ssh connection
      if (!socket.disconnected) {
        await connectToPod(socket, connection)
      }
    } catch (error) {
      logger.error(error)
      socket.disconnect()
    }
  })
}
