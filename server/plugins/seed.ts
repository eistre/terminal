import { createDomains, createExercises } from '~/prisma/seed'
import db from '~/prisma/db'

const logger = pino.child({ caller: 'seed' })

export default defineNitroPlugin(async () => {
  const count = await db.exercise.count()

  if (count === 0) {
    logger.info('Seeding database')
    await createExercises()
  }

  const domains = await db.domain.count()

  if (domains === 0 && process.env.NUXT_PUBLIC_RUNTIME === 'CLOUD') {
    logger.info('Adding allowed domains')
    await createDomains()
  }
})
