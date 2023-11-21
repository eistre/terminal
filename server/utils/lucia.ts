// https://lucia-auth.com/getting-started/nuxt/
import { lucia } from 'lucia'
import { h3 } from 'lucia/middleware'
import { prisma } from '@lucia-auth/adapter-prisma'
import db from '../../prisma/db'

export const auth = lucia({
  env: process.env ? 'DEV' : 'PROD',
  middleware: h3(),
  adapter: prisma(db),

  getUserAttributes: (data) => {
    return {
      name: data.name
    }
  }
})

export type Auth = typeof auth
