import db from '~/prisma/db'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'terminal_admin'

export default defineNitroPlugin(async () => {
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
