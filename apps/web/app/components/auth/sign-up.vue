<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';

const emit = defineEmits<{ requiresVerification: [email: string] }>();

const { t } = useI18n();
const toast = useToast();
const config = useConfig();

const { isAllowedEmail } = useEmailDomainValidation();

const fields: ComputedRef<AuthFormField[]> = computed(() => [
  {
    name: 'email',
    type: 'email',
    label: t('auth.email'),
    placeholder: t('auth.enterEmail'),
    required: true,
  },
  {
    name: 'name',
    type: 'text',
    label: t('auth.name'),
    placeholder: t('auth.enterName'),
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
  name: z.string(t('auth.nameRequired')).min(1, t('auth.nameMin')),
  password: z.string(t('auth.passwordRequired')).min(8, t('auth.passwordMin', { count: 8 })),
}));

type Schema = z.output<typeof schema.value>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { email, name, password } = payload.data;

  const { data, error: authError } = await authClient.signUp.email({
    email,
    name,
    password,
  });

  if (authError) {
    toast.add({
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('auth.signupError'),
    });
    return;
  }

  if (data?.user?.emailVerified) {
    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      toast.add({
        color: 'error',
        icon: 'i-lucide-alert-circle',
        title: t('auth.loginError'),
      });
    }
    return;
  }

  if (config.value.emailVerificationEnabled) {
    emit('requiresVerification', email);
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
