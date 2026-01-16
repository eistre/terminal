<script setup lang="ts">
const emit = defineEmits<{ requiresVerification: [email: string] }>();

const { t, locale } = useI18n();
const toast = useToast();
const config = useConfig();

const items = computed(() => [
  {
    slot: 'login',
    label: t('auth.login'),
  },
  {
    slot: 'signup',
    label: t('auth.signup'),
  },
]);

const authLabels = computed(() => {
  const labels: Record<string, string> = {};
  if (!config.value) {
    return labels;
  }

  for (const provider of Object.keys(config.value.providers)) {
    if (config.value.providers[provider]) {
      labels[provider] = locale.value === 'en'
        ? config.value.providers[provider].labels.en
        : config.value.providers[provider].labels.et;
    }
  }

  return labels;
});

function showAuthError() {
  toast.add({
    color: 'error',
    icon: 'i-lucide-alert-circle',
    title: t('auth.loginError'),
  });
}

async function signInWithOidc(providerId: string) {
  const { error } = await authClient.signIn.oauth2({ providerId, callbackURL: '/topics' });
  if (error) {
    showAuthError();
  }
}

async function signInWithProvider(provider: string) {
  const { error } = await authClient.signIn.social({ provider, callbackURL: '/topics' });
  if (error) {
    showAuthError();
  }
}
</script>

<template>
  <UButton
    v-if="authLabels.keycloak"
    icon="i-lucide-landmark"
    block
    color="neutral"
    variant="outline"
    @click="signInWithOidc('keycloak')"
  >
    {{ authLabels.keycloak }}
  </UButton>

  <UButton
    v-if="authLabels.microsoft"
    icon="i-lucide-landmark"
    block
    color="neutral"
    variant="outline"
    @click="signInWithProvider('microsoft')"
  >
    {{ authLabels.microsoft }}
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
