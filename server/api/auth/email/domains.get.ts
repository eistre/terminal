import db from '~/prisma/db'

export default defineEventHandler(async () => {
  const domains = await db.domain.findMany({ select: { name: true, verified: true, hidden: true } })

  return {
    domains
  }
})
