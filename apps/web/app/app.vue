<script setup lang="ts">
import { en, et } from '@nuxt/ui/locale';

const locales = { en, et };
const { t, locale } = useI18n();

useHead({
  htmlAttrs: { lang: locale },
  title: t('app.title'),
  meta: [{
    name: 'description',
    content: t('app.description'),
  }],
  link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
});
</script>

<template>
  <UApp :locale="locales[locale]">
    <Header />

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter />
  </UApp>
</template>
