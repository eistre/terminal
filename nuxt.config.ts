// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Linux terminal',
      meta: [
        {
          name: 'description',
          content: 'Linuxi käsurea harjutuskeskkond - Ubuntu terminal veebibrauseris'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/terminal.png' },
        { rel: 'apple-touch-icon', href: '/terminal.png' }
      ]
    }
  },

  runtimeConfig: {
    public: {
      runtime: ''
    }
  },

  nitro: {
    experimental: {
      websocket: true
    },
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

  modules: ['@nuxt/ui', '@nuxt/image', 'nuxt-security', '@nuxtjs/i18n', '@nuxt/icon'],

  // https://nuxt-security.vercel.app/documentation/getting-started/setup
  security: {
    xssValidator: false,
    headers: {
      originAgentCluster: false,
      crossOriginOpenerPolicy: false,
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'development' ? 'unsafe-none' : 'require-corp'
    }
  },

  i18n: {
    vueI18n: './i18n.config.ts'
  },

  imports: {
    presets: [
      { from: '@xterm/xterm', imports: ['Terminal'] },
      { from: '@xterm/addon-webgl', imports: ['WebglAddon'] },
      { from: '@xterm/addon-fit', imports: ['FitAddon'] }
    ]
  }
})
