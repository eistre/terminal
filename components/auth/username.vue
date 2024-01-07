// https://ui.nuxt.com/forms/form
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const i18n = useI18n()

const schema = computed(() => {
  return z.object({
    username: z.string({ required_error: i18n.t('auth.enter_name') })
      .min(1, i18n.t('auth.enter_name')),
    password: z.string({ required_error: i18n.t('auth.enter_password') })
      .min(8, i18n.t('auth.password_error'))
  })
})

type Schema = z.output<typeof schema.value>

const state = reactive({
  username: undefined,
  password: undefined
})

const isDisabled = computed(() => !schema.value.safeParse(state).success)
const toast = useToast()

async function onSubmit (event: FormSubmitEvent<Schema>) {
  const data = schema.value.safeParse(event.data)

  if (!data.success) {
    toast.add({
      id: 'auth_failed',
      icon: 'i-heroicons-x-mark',
      title: data.error.name,
      description: data.error.message,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  const { error } = await useFetch('/api/auth/authenticate', {
    method: 'POST',
    body: {
      name: data.data.username,
      password: data.data.password
    }
  })

  if (error.value) {
    const { message } = error.value.data
    let title = i18n.t('auth.auth_error')

    if (message === 'Incorrect password') {
      title = i18n.t('auth.auth_error_password')
    }

    toast.add({
      id: `auth_login_${title}`,
      icon: 'i-heroicons-x-mark',
      title,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  await navigateTo('/exercises')
}
</script>

<template>
  <UCard class="w-1/2">
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <UFormGroup :label="$t('auth.name')" name="username" eager-validation>
          <UInput
            v-model="state.username"
            :placeholder="$t('auth.john')"
            variant="outline"
            size="md"
          />
        </UFormGroup>

        <UFormGroup :label="$t('auth.password')" name="password" eager-validation>
          <UInput
            v-model="state.password"
            placeholder="********"
            size="md"
            type="password"
          />
        </UFormGroup>
      </div>

      <div class="flex justify-center">
        <UButton
          type="submit"
          variant="outline"
          class="w-1/4"
          size="md"
          :disabled="isDisabled"
        >
          {{ $t('auth.begin') }}
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
