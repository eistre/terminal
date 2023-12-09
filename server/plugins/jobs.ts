// https://github.com/hexagon/croner
import { Cron } from 'croner'
import dayjs, { Dayjs } from 'dayjs'
import db from '~/prisma/db'

const logger = pino.child({ caller: 'scheduler' })
const dockerLogger = pino.child({ caller: 'docker_build_job' })
const podLogger = pino.child({ caller: 'pod_delete_job' })
const userLogger = pino.child({ caller: 'user_delete_job' })

const DOCKER_CRON_TIMER = process.env.DOCKER_CRON_TIMER || '0 0 3 * * 7'
const POD_CRON_TIMER = process.env.POD_CRON_TIMER || '0 0 * * * *'
const USER_CRON_TIMER = process.env.USER_CRON_TIMER || '0 0 0 * * *'

const TOTAL_TRIES = 5

type ImageEvent = {
  stream?: string
  errorDetails?: {
    code: number
    message: string
  }
}

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

// Builds docker image
// https://github.com/apocas/dockerode
async function build (startTime: Dayjs, tries = 0) {
  if (tries > TOTAL_TRIES) {
    dockerLogger.error('Maximum number of tries exceeded')
    return
  }

  try {
    const stream = await docker.docker.buildImage(
      { context: '.', src: ['Dockerfile'] },
      { t: 'terminal/ubuntu' }
    )

    docker.docker.modem.followProgress(
      stream,
      async (error) => {
        if (error) {
          dockerLogger.error('Error during image build - retrying', error)
          await build(startTime, tries + 1)
        } else {
          docker.isImageReady = true
          emitter.emit('image')

          const executionTime = dayjs().diff(startTime, 'seconds')
          dockerLogger.info(`Docker image built successfully in ${executionTime} s`)
        }
      },
      async (event: ImageEvent) => {
        if (event.errorDetails) {
          dockerLogger.error(`Error during image build: ${event.errorDetails.message} - retrying`)
          await build(startTime, tries + 1)
        } else if (/^Step \d+\/\d+ :/.test(event.stream!)) {
          dockerLogger.info(event.stream)
        }
      }
    )
  } catch (error) {
    dockerLogger.error('Error during image build - retrying', error)
    await build(startTime, tries + 1)
  }
}

async function dockerBuildJob () {
  dockerLogger.info('Starting docker image build')
  docker.isImageReady = false
  emitter.emit('image')

  const startTime = dayjs()
  await build(startTime)
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
  await dockerBuildJob()
  await podDeleteJob()
  await userDeleteJob()

  // Schedule the jobs
  Cron(DOCKER_CRON_TIMER, { name: 'dockerBuildJob' }, dockerBuildJob)
  Cron(POD_CRON_TIMER, { name: 'podDeleteJob' }, podDeleteJob)
  Cron(USER_CRON_TIMER, { name: 'userDeleteJob' }, userDeleteJob)

  const jobs = Cron.scheduledJobs.map(job => job.name)
  logger.info(`Scheduled following jobs: ${jobs}`)
})
