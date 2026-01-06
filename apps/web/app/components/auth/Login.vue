<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';

const emit = defineEmits<{ requiresVerification: [email: string] }>();

const { t } = useI18n();
const toast = useToast();
const runtimeConfig = useRuntimeConfig();

const { data: allowedDomainsData } = await useFetch('/api/auth/email-domains', { method: 'GET' });

function isAllowedEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const adminEmail = runtimeConfig.public.defaultAdminEmail.trim().toLowerCase();

  if (normalized === adminEmail) {
    return true;
  }

  const at = normalized.lastIndexOf('@');
  if (at === -1) {
    return false;
  }

  const domain = normalized.slice(at + 1);
  const allowedDomains = allowedDomainsData.value?.domains ?? [];
  return allowedDomains.some(d => d.domain === domain);
}

const fields: ComputedRef<AuthFormField[]> = computed(() => [
  {
    name: 'email',
    type: 'email',
    label: t('auth.email'),
    placeholder: t('auth.enterEmail'),
    required: true,
  },
  {
    name: 'password',
    type: 'password',
    label: t('auth.password'),
    placeholder: t('auth.enterPassword'),
    required: true,
  },
]);

const schema = computed(() => z.object({
  email: z
    .email(t('auth.invalidEmail'))
    .refine(isAllowedEmail, t('auth.emailDomainNotAllowed')),
  password: z.string(t('auth.passwordRequired')).min(8, t('auth.passwordMin', { count: 8 })),
}));

type Schema = z.output<typeof schema.value>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { email, password } = payload.data;

  const { error: authError } = await authClient.signIn.email({
    email,
    password,
    rememberMe: true,
  });

  if (authError) {
    if (authError.status === 403 && authError.code === 'EMAIL_NOT_VERIFIED') {
      emit('requiresVerification', email);
      return;
    }

    toast.add({
      id: 'login-error',
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('auth.loginError'),
    });
  }
}
</script>

<template>
  <UAuthForm
    :schema="schema"
    :fields="fields"
    @submit="onSubmit"
  />
</template>
