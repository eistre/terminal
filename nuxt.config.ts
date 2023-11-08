// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Linuxi harjutuse',
      meta: [
        {
          name: 'description',
          content: 'Linuxi käsurea harjutuskeskkond - Ubuntu terminal veebibrauseris'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: 'https://i.imgur.com/uy6Ntdz.png' }
      ]
    }
  },
  devtools: { enabled: true },
  modules: ['@nuxt/ui']
})
