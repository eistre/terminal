// templates from https://ui.nuxt.com/getting-started/examples and https://i18n.nuxtjs.org/getting-started/basic-usage
<script setup lang="ts">
const { locale } = useI18n()
const cookie = useCookie('lang')

const lang = computed({
  get () {
    return locale.value === 'ee'
  },
  set () {
    locale.value = locale.value === 'ee' ? 'en' : 'ee'
    cookie.value = locale.value
  }
})
</script>

<template>
  <UButton
    :icon="lang ? 'i-twemoji-flag-estonia' : 'i-twemoji-flag-united-kingdom'"
    variant="ghost"
    color="gray"
    size="xl"
    @click="lang = !lang"
  />
</template>
