<script setup lang="ts">
const emit = defineEmits<{ requiresVerification: [email: string] }>();

const { t, locale } = useI18n();
const toast = useToast();
const config = useConfig();

const items = computed(() => [{
  slot: 'login',
  label: t('auth.login'),
}, {
  slot: 'signup',
  label: t('auth.signup'),
}]);

const microsoftLabel = computed(() => {
  if (!config.value.microsoft) {
    return '';
  }

  return locale.value === 'en'
    ? config.value.microsoft.labels.en
    : config.value.microsoft.labels.et;
});

async function signInWithProvider(provider: string) {
  const { error } = await authClient.signIn.social({ provider, callbackURL: '/topics' });

  if (error) {
    toast.add({
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('auth.loginError'),
    });
  }
}
</script>

<template>
  <UButton
    v-if="config.microsoft"
    icon="i-lucide-landmark"
    block
    color="neutral"
    variant="outline"
    @click="signInWithProvider('microsoft')"
  >
    {{ microsoftLabel }}
  </UButton>

  <UTabs :items="items" :ui="{ root: 'min-h-[320px]' }">
    <template #login>
      <AuthLogin class="mt-2" @requires-verification="(email) => emit('requiresVerification', email)" />
    </template>

    <template #signup>
      <AuthSignUp class="mt-2" @requires-verification="(email) => emit('requiresVerification', email)" />
    </template>
  </UTabs>
</template>
