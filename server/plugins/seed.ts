import { seed } from '~/prisma/seed'
import db from '~/prisma/db'

const logger = pino.child({ caller: 'seed' })

export default defineNitroPlugin(async () => {
  // @ts-ignore
  const count = await db.exercise.count()

  if (count === 0) {
    logger.info('Seeding database')
    await seed()
  }
})
