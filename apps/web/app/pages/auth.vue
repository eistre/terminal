<script setup lang="ts">
definePageMeta({ middleware: ['require-no-session'] });

type Step = 'form' | 'verify';
const step = ref<Step>('form');
const emailForVerification = ref<string>('');
const config = useConfig();
const session = authClient.useSession();

watch(session, (newSession) => {
  if (newSession.data) {
    navigateTo('/topics');
  }
}, { deep: true });

function onRequiresVerification(email: string) {
  if (!config.value.emailVerificationEnabled) {
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
      <AuthVerify v-else-if="config.emailVerificationEnabled" :email="emailForVerification" />
    </UPageCard>
  </UContainer>
</template>
