// https://lucia-auth.com/getting-started/nuxt/
import { lucia } from 'lucia'
import { h3 } from 'lucia/middleware'
import { prisma } from '@lucia-auth/adapter-prisma'
import jwt from 'jsonwebtoken'
import db from '../../prisma/db'

const secret = process.env.JWT_SECRET ?? 'secret_example'

export const auth = lucia({
  env: process.env ? 'DEV' : 'PROD',
  middleware: h3(),
  adapter: prisma(db),

  getUserAttributes: ({ id, name }) => {
    return {
      name,
      // eslint-disable-next-line import/no-named-as-default-member
      token: jwt.sign({ id }, secret, { expiresIn: '6h' })
    }
  }
})

export type Auth = typeof auth
