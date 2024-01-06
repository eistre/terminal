// https://github.com/hexagon/croner
import { Cron } from 'croner'
import dayjs, { Dayjs } from 'dayjs'
import db from '~/prisma/db'

const logger = pino.child({ caller: 'scheduler' })
const dockerLogger = pino.child({ caller: 'docker_pull_job' })
const podLogger = pino.child({ caller: 'pod_delete_job' })
const userLogger = pino.child({ caller: 'user_delete_job' })

const DOCKER_CRON_TIMER = process.env.DOCKER_CRON_TIMER || '0 0 3 * * 7'
const POD_CRON_TIMER = process.env.POD_CRON_TIMER || '0 0 * * * *'
const USER_CRON_TIMER = process.env.USER_CRON_TIMER || '0 0 0 * * *'

const TOTAL_TRIES = 5

async function deleteExpiredNamespaces (namespaces: string[]): Promise<number> {
  let count = 0

  for (const namespace of namespaces) {
    try {
      await kubernetes.deleteNamespace(namespace)
      count++
      podLogger.debug(`Deleted namespace: ${namespace}`)
    } catch (error) {
      podLogger.error(error)
    }
  }

  return count
}

// Pulls docker image
// https://github.com/apocas/dockerode
function pull (startTime: Dayjs, tries = 0) {
  if (tries > TOTAL_TRIES) {
    dockerLogger.error('Maximum number of tries exceeded')
    return
  }

  docker.docker.pull('ghcr.io/eistre/terminal-ubuntu', {}, (error, stream) => {
    if (error) {
      dockerLogger.error(`Error during image pull - retrying: ${error}`)
      pull(startTime, tries + 1)
    }

    docker.docker.modem.followProgress(
      stream,
      (error) => {
        if (error) {
          dockerLogger.error(`Error during image pull - retrying: ${error}`)
          pull(startTime, tries + 1)
        } else {
          docker.isImageReady = true
          emitter.emit('image')

          const executionTime = dayjs().diff(startTime, 'seconds')
          dockerLogger.info(`Docker image pulled successfully in ${executionTime} s`)
        }
      }
    )
  })
}

function dockerPullJob () {
  dockerLogger.info('Pulling Docker image')
  docker.isImageReady = false
  emitter.emit('image')

  const startTime = dayjs()
  pull(startTime)
}

async function podDeleteJob () {
  const namespaces = (await kubernetes.getNamespaces())
    .filter(namespace => dayjs().isAfter(namespace.metadata?.annotations?.expireTime))
    .map(namespace => namespace.metadata!.name!)

  const count = await deleteExpiredNamespaces(namespaces)

  if (count > 0) {
    podLogger.info(`Deleted ${count} expired ${count === 1 ? 'pod' : 'pods'}`)
  }
}

async function userDeleteJob () {
  const { count } = await db.user.deleteMany({
    where: {
      expireTime: {
        lt: dayjs().format()
      }
    }
  })

  if (count > 0) {
    userLogger.info(`Deleted ${count} old ${count === 1 ? 'user' : 'users'}`)
  }
}

export default defineNitroPlugin(async () => {
  // Run jobs during startup
  if (process.env.RUNTIME !== 'CLOUD') {
    dockerPullJob()
  }

  await podDeleteJob()
  await userDeleteJob()

  // Schedule the jobs
  if (process.env.RUNTIME !== 'CLOUD') {
    Cron(DOCKER_CRON_TIMER, { name: 'dockerPullJob' }, dockerPullJob)
  }

  Cron(POD_CRON_TIMER, { name: 'podDeleteJob' }, podDeleteJob)
  Cron(USER_CRON_TIMER, { name: 'userDeleteJob' }, userDeleteJob)

  const jobs = Cron.scheduledJobs.map(job => job.name)
  logger.info(`Scheduled following jobs: ${jobs}`)
})
