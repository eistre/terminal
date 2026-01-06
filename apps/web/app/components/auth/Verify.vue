<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { z } from 'zod';

const props = defineProps<{ email: string }>();

const { t } = useI18n();
const toast = useToast();

const otpLength = 6;
const schema = computed(() => z.object({
  otp: z.array(z.string().regex(/^\d$/)).length(otpLength),
}));

type Schema = z.output<typeof schema.value>;

const state = reactive<Schema>({
  otp: Array.from({ length: otpLength }, () => ''),
});

const canSubmit = computed(() => schema.value.safeParse(state).success);

const resending = ref(false);
const resendCooldownSeconds = ref(0);
let resendCountdownInterval: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  if (!resendCountdownInterval) {
    startResendCooldown(30);
  }
});

onBeforeUnmount(() => {
  if (resendCountdownInterval) {
    clearInterval(resendCountdownInterval);
  }
});

function startResendCooldown(seconds: number) {
  resendCooldownSeconds.value = seconds;
  if (resendCountdownInterval) {
    clearInterval(resendCountdownInterval);
  }

  resendCountdownInterval = setInterval(() => {
    resendCooldownSeconds.value = Math.max(0, resendCooldownSeconds.value - 1);
    if (resendCooldownSeconds.value === 0 && resendCountdownInterval) {
      clearInterval(resendCountdownInterval);
      resendCountdownInterval = undefined;
    }
  }, 1000);
}

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { otp } = payload.data;

  const { error } = await authClient.emailOtp.verifyEmail({
    email: props.email,
    otp: otp.join(''),
  });

  if (error) {
    let title = t('auth.emailVerification.verificationFailed');
    if (error.status === 400 && error.code === 'INVALID_OTP') {
      title = t('auth.emailVerification.invalidCode');
    }

    toast.add({
      id: 'verify-email-error',
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title,
    });
  }
}

async function resend() {
  resending.value = true;

  const { error } = await authClient.emailOtp.sendVerificationOtp({
    email: props.email,
    type: 'email-verification',
  });

  if (error) {
    resending.value = false;
    toast.add({
      id: 'resend-otp-error',
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('auth.emailVerification.resendFailed'),
    });
    return;
  }

  startResendCooldown(30);
  resending.value = false;

  toast.add({
    id: 'resend-otp-success',
    color: 'success',
    icon: 'i-lucide-check',
    title: t('auth.emailVerification.resendSuccess'),
  });
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <h1 class="text-2xl font-semibold">
        {{ t('auth.emailVerification.title') }}
      </h1>
      <p class="text-sm text-muted">
        {{ t('auth.emailVerification.description', { email }) }}
      </p>
    </div>

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <div class="flex items-center justify-center">
        <UPinInput
          v-model="state.otp"
          :length="otpLength"
        />
      </div>

      <div class="flex items-center justify-center gap-2">
        <UButton
          type="button"
          variant="ghost"
          color="neutral"
          :disabled="resendCooldownSeconds > 0 || resending"
          @click="resend"
        >
          {{ resendCooldownSeconds > 0
            ? t('auth.emailVerification.resendWithCountdown', { seconds: resendCooldownSeconds })
            : t('auth.emailVerification.resend') }}
        </UButton>
        <UButton
          type="submit"
          variant="solid"
          :disabled="!canSubmit"
        >
          {{ t('auth.emailVerification.verify') }}
        </UButton>
      </div>
    </UForm>
  </div>
</template>
