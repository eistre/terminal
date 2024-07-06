<script setup lang="ts">
const user = useUser()
const cluster = useCluster()

const config = useRuntimeConfig()
const isCloud = config.public.runtime === 'CLOUD'
</script>

<template>
  <div class="z-50 bg-primary-600/90 dark:bg-gray-900/90">
    <UContainer class="p-2 h-20 flex justify-between">
      <NuxtImg
        :alt="$t('bar.university')"
        :src="$t('bar.img')"
        class="hover:cursor-pointer"
        @click="navigateTo('/')"
      />
      <div class="flex items-center">
        <NavigationClusterStatus v-if="isCloud && user && cluster !== 'Running'" />
        <NavigationDomainButton v-if="isCloud && user?.role === 'ADMIN'" />
        <NavigationThemeButton />
        <NavigationLocaleButton />
        <NavigationUser v-if="user" />
      </div>
    </UContainer>

    <!-- https://ui.nuxt.com/layout/divider -->
    <UDivider :ui="{ border: { size: { horizontal: 'border-t-2' } } }" />
  </div>
</template>
