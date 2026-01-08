<script setup lang="ts">
const session = authClient.useSession();
</script>

<template>
  <UHeader class="light:bg-primary" :toggle="false">
    <template #left>
      <img
        :alt="$t('app.institute')"
        :src="`/${$t('app.logo')}`"
        class="py-3.5 sm:py-2 h-16 hover:cursor-pointer"
        @click="session.data ? navigateTo('/topics') : navigateTo('/')"
      >
    </template>

    <template #right>
      <HeaderColorModeToggle class="light:hover:bg-neutral-100/10" />
      <HeaderLocaleSwitcher class="light:hover:bg-neutral-100/10" />
      <HeaderUserMenu v-if="session.data?.user" class="light:hover:bg-neutral-100/10" />
    </template>
  </UHeader>
</template>
