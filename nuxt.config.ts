// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
        { rel: 'icon', type: 'image/png', href: '/terminal.png' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      runtime: ''
    }
  },
  nitro: {
    entry: process.env.NODE_ENV === 'production' ? undefined : '../preset/entry.dev',
    preset: './preset',
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
  modules: ['@nuxt/ui', '@nuxt/image', 'nuxt-security', '@nuxtjs/i18n'],
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
  ui: {
    icons: ['ion', 'twemoji']
  },
  i18n: {
    vueI18n: './i18n.config.ts'
  },
  imports: {
    presets: [
      { from: 'xterm', imports: ['Terminal'] },
      { from: 'xterm-addon-webgl', imports: ['WebglAddon'] },
      { from: 'xterm-addon-fit', imports: ['FitAddon'] }
    ]
  }
})
