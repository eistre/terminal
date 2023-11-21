<script setup lang="ts">
const user = useUser()
</script>

<template>
  <div class="bg-blue-600 dark:bg-cool-900/75">
    <UContainer class="p-2 h-20 flex justify-between">
      <NuxtImg
        alt="Tartu Ülikool arvutiteaduse instituut"
        src="/arvutiteaduse_instituut_est_white_2021.svg"
      />
      <div class="flex items-center">
        <NavigationThemeButton />
        <NavigationLogoutButton v-if="user" />
        <NavigationDeleteButton v-if="user" />
      </div>
    </UContainer>

    <!-- https://ui.nuxt.com/layout/divider -->
    <UDivider :ui="{ border: { size: { horizontal: 'border-t-2' } } }" />
  </div>
</template>
