<script setup lang="ts">
definePageMeta({
  middleware: 'unprotected'
})

const config = useRuntimeConfig()
const isCloud = config.public.runtime === 'CLOUD'
</script>

<template>
  <UContainer>
    <UCard :ui="{ ring: '', shadow: '' }">
      <template #header>
        <div class="flex flex-col items-center gap-2 text-3xl font-semibold">
          <span>{{ $t('main.title1') }}</span>
          <span>{{ $t('main.title2') }}</span>
        </div>
      </template>

      <div class="flex flex-col items-center gap-4">
        <span class="flex justify-center text-2xl font-semibold">{{ $t('main.info1') }}</span>
        <span class="w-2/3">{{ $t('main.info2') }}</span>
        <span class="w-2/3">{{ $t('main.info3') }}</span>
        <span class="w-2/3">{{ $t('main.info4') }}</span>
      </div>

      <template #footer>
        <div class="flex justify-center">
          <AuthEmail v-if="isCloud" />
          <AuthUsername v-else />
        </div>
      </template>
    </UCard>
  </UContainer>
</template>
