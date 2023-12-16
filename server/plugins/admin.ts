import { useLogger } from '@nuxt/kit'
import db from '~/prisma/db'

const logger = useLogger()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'terminal_admin'

export default defineNitroPlugin(async () => {
  const length = ADMIN_PASSWORD.length
  const line = '-'.repeat(length)
  const space = ' '.repeat(length)
  logger.info(`
      |--------------------------${line}|
      |                          ${space}|
      |     Admin password: ${process.env.ADMIN_PASSWORD}     |
      |                          ${space}|
      |--------------------------${line}|
      `)

  await db.user.deleteMany({ where: { name: 'admin' } })
  await auth.createUser({
    key: {
      providerId: 'name',
      providerUserId: 'admin',
      password: ADMIN_PASSWORD
    },
    attributes: {
      name: 'admin',
      expireTime: null,
      role: 'ADMIN'
    }
  })
})
