<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const i18n = useI18n()
const toast = useToast()

const schema = computed(() => {
  return z.object({
    code: z.string({ required_error: i18n.t('auth.enter_code') })
      .length(8, i18n.t('auth.code_req'))
  })
})

type Schema = z.output<typeof schema.value>

const state = reactive({
  code: undefined
})

const isDisabled = computed(() => !schema.value.safeParse(state).success)
const sent = ref(false)

async function onSubmit (event: FormSubmitEvent<Schema>) {
  const data = schema.value.safeParse(event.data)

  if (!data.success) {
    toast.add({
      id: 'verify_failed',
      icon: 'i-heroicons-x-mark',
      title: data.error.name,
      description: data.error.message,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  const { error } = await useFetch(`/api/auth/email/${data.data.code}`)

  if (error.value) {
    const { message } = error.value.data
    let title = i18n.t('auth.verify_error')

    if (message === 'Invalid code') {
      title = i18n.t('auth.verify_invalid')
    } else if (message === 'Expired code') {
      title = i18n.t('auth.verify_expired')
    }

    toast.add({
      id: `verify_${title}`,
      icon: 'i-heroicons-x-mark',
      title,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  await navigateTo('/exercises')
}

async function resend () {
  const { error } = await useFetch('/api/auth/email/resend')

  if (error.value) {
    const { message } = error.value.data
    let title = i18n.t('auth.resend_failed')

    if (message === 'Too many code requests') {
      title = i18n.t('auth.resend_many')
    }

    toast.add({
      id: `verify_${title}`,
      icon: 'i-heroicons-x-mark',
      title,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  sent.value = true
  toast.add({
    id: 'verify_success',
    icon: 'i-heroicons-x-mark',
    title: i18n.t('auth.resend_successful'),
    timeout: 5000,
    color: 'green'
  })
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-4 text-center" @submit="onSubmit">
    <div class="flex flex-col items-center gap-4">
      <span class="font-semibold text-2xl">{{ $t('auth.complete_verify') }}</span>
      <span>{{ $t('auth.complete_verify1') }}</span>
      <span>{{ $t('auth.complete_verify2') }}</span>
    </div>
    <div class="flex justify-center">
      <UFormGroup :label="$t('auth.code')" name="code" eager-validation>
        <UInput
          v-model="state.code"
          placeholder="********"
        />
      </UFormGroup>
    </div>

    <div class="flex justify-center gap-2">
      <UButton
        variant="ghost"
        class="w-1/3 flex justify-center"
        color="gray"
        size="md"
        :disabled="sent"
        @click="resend"
      >
        {{ $t('auth.resend') }}
      </UButton>
      <UButton
        type="submit"
        variant="outline"
        class="w-1/4"
        size="md"
        :disabled="isDisabled"
      >
        {{ $t('auth.verify') }}
      </UButton>
    </div>
  </UForm>
</template>
