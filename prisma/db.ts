// https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
import { PrismaClient as PrismaClientSqlServer } from '@prisma/client/sqlserver/index.js'
import { PrismaClient as PrismaClientPg } from '@prisma/client/pg/index.js'

const prismaClientSingleton = () => {
  if (process.env.DATABASE_URL?.startsWith('sqlserver')) {
    return new PrismaClientSqlServer()
  }

  return new PrismaClientPg()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const db = globalForPrisma.prisma ?? prismaClientSingleton()

export default db

if (process.env.NODE_ENV !== 'production') { globalForPrisma.prisma = db }
