// https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
import { PrismaClient as PrismaClientSqlServer } from '@prisma/client/sqlserver/index.js'
import { PrismaClient as PrismaClientPg } from '@prisma/client/pg/index.js'

const prismaClientPostgres = () => {
  return new PrismaClientPg()
}

const prismaClientSqlServer = () => {
  return new PrismaClientSqlServer()
}

type PrismaClientPostgres = ReturnType<typeof prismaClientPostgres>
type PrismaClientSql = ReturnType<typeof prismaClientSqlServer>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientPostgres | PrismaClientSql | undefined
}

const db = globalForPrisma.prisma ?? (process.env.DATABASE_URL?.startsWith('sqlserver') ? prismaClientSqlServer() : prismaClientPostgres())

export default db

if (process.env.NODE_ENV !== 'production') { globalForPrisma.prisma = db }
