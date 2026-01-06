<script setup lang="ts">
import ColorModeButton from './ColorModeButton.vue';
import LocaleSelect from './LocaleSelect.vue';
import UserSelect from './UserSelect.vue';

const session = authClient.useSession();
</script>

<template>
  <UHeader class="light:bg-primary" :toggle="false">
    <template #left>
      <img
        :alt="$t('app.institute')"
        :src="$t('app.logo')"
        class="h-16 w-auto hover:cursor-pointer"
        @click="session.data ? navigateTo('/topics') : navigateTo('/')"
      >
    </template>

    <template #right>
      <ColorModeButton class="light:hover:bg-neutral-100/10" />
      <LocaleSelect class="light:hover:bg-neutral-100/10" />
      <UserSelect v-if="session.data?.user" class="light:hover:bg-neutral-100/10" />
    </template>
  </UHeader>
</template>
