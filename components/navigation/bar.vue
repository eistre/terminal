<script setup lang="ts">
const user = useUser()
</script>

<template>
  <div class="z-50 bg-primary-600/90 dark:bg-gray-900/90">
    <UContainer class="p-2 h-20 flex justify-between">
      <NuxtImg
        :alt="$t('bar.university')"
        :src="$t('bar.img')"
      />
      <div class="flex items-center">
        <NavigationDockerImageStatus />
        <NavigationThemeButton />
        <NavigationLocaleButton />
        <NavigationLogoutButton v-if="user" />
        <NavigationDeleteButton v-if="user" />
      </div>
    </UContainer>

    <!-- https://ui.nuxt.com/layout/divider -->
    <UDivider :ui="{ border: { size: { horizontal: 'border-t-2' } } }" />
  </div>
</template>
