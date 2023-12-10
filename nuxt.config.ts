// https://nuxt.com/docs/api/configuration/nuxt-config
import { useLogger } from '@nuxt/kit'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'terminal_admin'
const logger = useLogger()

export default defineNuxtConfig({
  hooks: {
    ready: () => {
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
    }
  },
  app: {
    head: {
      title: 'Linuxi harjutused',
      meta: [
        {
          name: 'description',
          content: 'Linuxi käsurea harjutuskeskkond - Ubuntu terminal veebibrauseris'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/terminal.png' }
      ]
    }
  },
  nitro: {
    storage: {
      k8s: {
        driver: 'fs',
        base: './kubernetes'
      },
      ssh: {
        driver: 'fs',
        base: './.ssh'
      }
    }
  },
  routeRules: {
    '/exercises/**': { ssr: false, prerender: false }
  },
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image', 'nuxt-security'],
  // https://nuxt-security.vercel.app/documentation/getting-started/setup
  security: {
    headers: {
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'development' ? 'unsafe-none' : 'require-corp'
    }
  },
  ui: {
    icons: ['simple-icons']
  },
  imports: {
    presets: [
      { from: 'xterm', imports: ['Terminal'] },
      { from: 'xterm-addon-webgl', imports: ['WebglAddon'] },
      { from: 'xterm-addon-fit', imports: ['FitAddon'] }
    ]
  }
})
