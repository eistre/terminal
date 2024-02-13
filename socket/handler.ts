// https://github.com/nuxt/nuxt/pull/19230
// Modified from: https://gitlab.com/JoonasHalapuu/ubuntuterminal/-/blob/main/sshConnection.js?ref_type=heads
import { Client } from 'ssh2'
import jwt, { type VerifyErrors } from 'jsonwebtoken'
import { type Server, Socket } from 'socket.io'
import type { ExtendedError } from 'socket.io/dist/namespace'
import db from '~/prisma/db'
import kubernetes from '~/server/utils/kubernetes'
import azure from '~/server/utils/azure'
import emitter from '~/server/utils/emitter'

const podLogger = pino.child({ caller: 'pod' })
const socketLogger = pino.child({ caller: 'socket' })
const sshLogger = pino.child({ caller: 'ssh' })
const inotifyLogger = pino.child({ caller: 'inotify' })

const SECRET = process.env.JWT_SECRET || 'secret_example'
const isCloud = process.env.NUXT_PUBLIC_RUNTIME === 'CLOUD'

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
    podLogger.error('Private key not found')
    socket.disconnect()
    await kubernetes.deleteNamespace(`ubuntu-${socket.data.clientId}`)
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
  let buffer = Buffer.alloc(0)
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
      socketLogger.debug(`Resetting exercise ${exerciseId} for client ${clientId}`)

      const ids = await db.task.findMany({ where: { exercise_id: Number(exerciseId) }, select: { id: true } })
      await db.completedTask.deleteMany({ where: { user_id: clientId, task_id: { in: ids.map(id => id.id) } } })

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
      socketLogger.error(`Resetting exercise failed for client ${clientId}: ${error}`)
      socket.emit('reset_exercise', { status: false })
    }
  })

  pod.on('ready', () => {
    sshLogger.info(`Created ssh connection for client: ${clientId}`)
    socket.send({ data: '\r\n*** SSH Connected established ***\r\n\n' })
    socket.emit('ready')

    pod.exec('inotifywait /home /home/user -m', (error, channel) => {
      if (error) {
        inotifyLogger.error(`inotify error for client ${clientId}: ${error}`)
      }

      channel.on('close', () => {
        inotifyLogger.debug(`inotify instance closed for client ${clientId}`)
      })

      channel.on('data', (data: Buffer) => {
        evaluate(socket, data.toString('binary'), tasks)
      })

      channel.stderr.on('data', (data: Buffer) => {
        inotifyLogger.debug(data.toString('binary'))
      })
    })

    pod.shell((error, stream) => {
      if (error) {
        sshLogger.error(`Ssh shell error for client ${clientId}: ${error}`)
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
        socketLogger.info(`Resetting pod for client ${clientId}`)
        await kubernetes.deleteNamespace(`ubuntu-${clientId}`)
      })

      stream.on('data', (data: Buffer) => {
        const dataString = data.toString('binary')
        buffer = Buffer.concat([buffer, data])

        if (buffer.length > 2048 || dataString.includes('user@ubuntu:~$')) {
          evaluate(socket, buffer.toString('binary'), tasks)
          buffer = Buffer.alloc(0)
        }

        socket.send({ data: dataString })
      })

      stream.on('close', () => {
        pod.end()
      })
    })
  })

  pod.on('close', () => {
    sshLogger.info(`Connection closed for client: ${clientId}`)
    socket.send({ data: '\r\n*** SSH Connection terminated ***\r\n' })
    socket.disconnect()
  })

  pod.on('error', async (error) => {
    socket.send({ data: `\r\n*** SSH Connection error: ${error.message} ***\r\n` })

    const getReason = () => {
      if (error.message.includes('ECONNREFUSED')) {
        return 'refused'
      }

      return error.message.includes('ECONNRESET') ? 'reset' : 'timed out'
    }

    // If connection refused - try again
    if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].some(reason => error.message.includes(reason))) {
      sshLogger.warn(`Connection ${getReason()} for client: ${clientId} - retrying`)
      await connectToPod(socket, connection)
    } else {
      sshLogger.error(`Ssh error for client ${clientId}: ${error}`)
      socket.disconnect()
    }
  })
}

async function evaluate (socket: Socket, data: string, tasks: { id: number, regex: string }[]) {
  const completed = tasks
    // eslint-disable-next-line security-node/non-literal-reg-expr
    .filter(task => new RegExp(task.regex).test(data))
    .map(task => ({ user_id: socket.data.clientId, task_id: task.id }))

  if (completed.length > 0) {
    const taskIds = completed.map(task => task.task_id)

    taskIds.forEach((id) => {
      const index = tasks.findIndex(task => task.id === id)
      tasks.splice(index, 1)
    })

    socket.emit('complete', { data: taskIds })

    await db.completedTask.createMany({
      data: completed,
      skipDuplicates: true
    })
  }
}

async function startCluster (server: Server) {
  server.emit('clusterStatus', { status: azure.getClusterStatus() })

  switch (azure.getClusterStatus()) {
    case 'Running':
    case 'Starting':
      break
    case 'Stopping':
      await azure.waitForClusterStatus('Stopped')
      setTimeout(async () => {
        if (azure.getClusterStatus() === 'Stopped') {
          await azure.startCluster()
        }
      }, 3000)
      break
    case 'Stopped':
      await azure.startCluster()
      break
  }
}

export default function handleSocket (server: Server) {
  if (isCloud) {
    server.on('connection', async () => {
      await startCluster(server)
    })

    emitter.on('clusterStatus', (data) => {
      server.emit('clusterStatus', data)
    })
  }

  const proxy = server.of('/terminal')

  // For socket authentication
  // https://socket.io/docs/v4/middlewares/
  proxy.use(verifyToken)

  proxy.on('connection', async (socket) => {
    try {
      if (isCloud && azure.getClusterStatus() !== 'Running') {
        socket.send({ data: '\r\n*** Waiting for cluster to start *** \r\n' })
        await azure.waitForClusterStatus('Running')
      }

      socket.send({ data: '\r\n*** Starting Ubuntu pod ***\r\n' })
      const connection = await kubernetes.createOrUpdatePod(socket.data.clientId)

      // Create ssh connection
      if (!socket.disconnected) {
        await connectToPod(socket, connection)
      }
    } catch (error) {
      podLogger.error(`Pod error for client ${socket.data.clientId}: ${error}`)
      socket.disconnect()
    }
  })
}
