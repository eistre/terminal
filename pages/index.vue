<script setup lang="ts">
// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
definePageMeta({
  middleware: 'unprotected'
})
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
          <AuthAuthenticate />
        </div>
      </template>
    </UCard>
  </UContainer>
</template>
