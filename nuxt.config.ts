// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
