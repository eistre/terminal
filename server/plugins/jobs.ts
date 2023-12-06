// https://github.com/hexagon/croner
import { Cron } from 'croner'
import dayjs from 'dayjs'
import db from '~/prisma/db'

const logger = pino.child({ caller: 'scheduler' })
const podLogger = pino.child({ caller: 'pod_delete_job' })
const userLogger = pino.child({ caller: 'user_delete_job' })

const POD_CRON_TIMER = process.env.POD_CRON_TIMER || '0 0 * * * *'
const USER_CRON_TIMER = process.env.USER_CRON_TIMER || '0 0 0 * * *'

export default defineNitroPlugin(async () => {
  // Run jobs during startup
  await podDeleteJob()
  await userDeleteJob()

  // Schedule the jobs
  Cron(POD_CRON_TIMER, { name: 'podDeleteJob' }, podDeleteJob)
  Cron(USER_CRON_TIMER, { name: 'userDeleteJob' }, userDeleteJob)

  const jobs = Cron.scheduledJobs.map(job => job.name)
  logger.info(`Scheduled following jobs: ${jobs}`)
})

const deleteExpiredNamespaces = async (namespaces: string[]): Promise<number> => {
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

const podDeleteJob = async () => {
  const namespaces = (await kubernetes.getNamespaces())
    .filter(namespace => dayjs().isAfter(namespace.metadata?.annotations?.expireTime))
    .map(namespace => namespace.metadata!.name!)

  const count = await deleteExpiredNamespaces(namespaces)

  if (count > 0) {
    podLogger.info(`Deleted ${count} expired ${count === 1 ? 'pod' : 'pods'}`)
  }
}

const userDeleteJob = async () => {
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
