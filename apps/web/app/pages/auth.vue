<script setup lang="ts">
definePageMeta({ middleware: ['require-no-session'] });

type Step = 'form' | 'verify';
const step = ref<Step>('form');
const emailForVerification = ref<string>('');
const runtimeConfig = useRuntimeConfig();
const session = authClient.useSession();

watch(session, (newSession) => {
  if (newSession.data) {
    navigateTo('/topics');
  }
}, { deep: true });

function onRequiresVerification(email: string) {
  if (!runtimeConfig.public.emailVerificationEnabled) {
    return;
  }

  emailForVerification.value = email;
  step.value = 'verify';
}
</script>

<template>
  <UContainer class="py-12">
    <UPageCard class="max-w-md mx-auto">
      <AuthForm v-if="step === 'form'" @requires-verification="onRequiresVerification" />
      <AuthVerify v-else-if="runtimeConfig.public.emailVerificationEnabled" :email="emailForVerification" />
    </UPageCard>
  </UContainer>
</template>
