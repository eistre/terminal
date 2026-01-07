<script setup lang="ts">
const emit = defineEmits<{ requiresVerification: [email: string] }>();

const { t } = useI18n();
const toast = useToast();

const { data } = await useFetch('/api/auth/providers', { method: 'GET' });

const items = computed(() => [{
  slot: 'login',
  label: t('auth.login'),
}, {
  slot: 'signup',
  label: t('auth.signup'),
}]);

const isMicrosoftEnabled = computed(() => data.value?.microsoft.enabled ?? false);

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
    v-if="isMicrosoftEnabled"
    icon="i-lucide-landmark"
    block
    color="neutral"
    variant="outline"
    @click="signInWithProvider('microsoft')"
  >
    {{ data?.microsoft.label ?? 'Microsoft' }}
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
