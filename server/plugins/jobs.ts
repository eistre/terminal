import { Cron } from 'croner'
import dayjs from 'dayjs'
import db from '~/prisma/db'
import azure from '~/server/utils/azure'

const logger = pino.child({ caller: 'scheduler' })
const podLogger = pino.child({ caller: 'pod_delete_job' })
const userLogger = pino.child({ caller: 'user_delete_job' })

const POD_CRON_TIMER = process.env.POD_CRON_TIMER || '0 0 * * * *'
const USER_CRON_TIMER = process.env.USER_CRON_TIMER || '0 0 0 * * *'
const isCloud = process.env.NUXT_PUBLIC_RUNTIME === 'CLOUD'

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

async function podDeleteJob () {
  await azure.setClusterStatus()

  if (isCloud && azure.getClusterStatus() !== 'Running') {
    return
  }

  const namespaces = await kubernetes.getNamespaces()

  if (isCloud && namespaces.length === 0 && !azure.getStopLock()) {
    await azure.stopCluster()
    return
  }

  const expiredNamespaces = namespaces.filter(namespace => dayjs().isAfter(namespace.metadata?.annotations?.expireTime))
    .map(namespace => namespace.metadata!.name!)

  const count = await deleteExpiredNamespaces(expiredNamespaces)

  if (count > 0) {
    podLogger.info(`Deleted ${count} expired ${count === 1 ? 'pod' : 'pods'}`)
  }
}

async function userDeleteJob () {
  const { count } = await db.user.deleteMany({
    where: {
      expireTime: {
        lt: dayjs().format(),
        not: null
      }
    }
  })

  if (count > 0) {
    userLogger.info(`Deleted ${count} old ${count === 1 ? 'user' : 'users'}`)
  }
}

export default defineNitroPlugin(async () => {
  if (isCloud) {
    await azure.setClusterStatus()
  }

  await podDeleteJob()
  await userDeleteJob()

  // Schedule the jobs
  Cron(POD_CRON_TIMER, { name: 'podDeleteJob' }, podDeleteJob)
  Cron(USER_CRON_TIMER, { name: 'userDeleteJob' }, userDeleteJob)

  const jobs = Cron.scheduledJobs.map(job => job.name)
  logger.info(`Scheduled following jobs: ${jobs}`)
})
