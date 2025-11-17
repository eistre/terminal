<script setup lang="ts">
import ColorModeButton from './ColorModeButton.vue';
import LocaleSelect from './LocaleSelect.vue';
</script>

<template>
  <UHeader class="light:bg-primary-700/90">
    <template #left>
      <NuxtImg
        :alt="$t('app.institute')"
        :src="`/${$t('app.logo')}`"
        class="h-16 w-auto hover:cursor-pointer"
        @click="navigateTo('/')"
      />
    </template>

    <template #right>
      <ColorModeButton class="light:hover:bg-primary/75" />
      <LocaleSelect class="light:hover:bg-primary/75" />
    </template>
  </UHeader>
</template>
