// templates and snippets from https://ui.nuxt.com/forms/form
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const i18n = useI18n()
const toast = useToast()

const items = computed(() => {
  return [{
    slot: 'login',
    label: i18n.t('auth.login')
  }, {
    slot: 'create',
    label: i18n.t('auth.create')
  }]
})

const schema = computed(() => {
  return z.object({
    username: z.string({ required_error: i18n.t('auth.enter_name') })
      .min(1, i18n.t('auth.enter_name')),
    password: z.string({ required_error: i18n.t('auth.enter_password') })
      .min(8, i18n.t('auth.password_error'))
  })
})

type Schema = z.output<typeof schema.value>

const loginState = reactive({
  username: undefined,
  password: undefined
})
const createState = reactive({
  username: undefined,
  password: undefined
})

const isLoginDisabled = computed(() => !schema.value.safeParse(loginState).success)
const isCreateDisabled = computed(() => !schema.value.safeParse(createState).success)

async function onLoginSubmit (event: FormSubmitEvent<Schema>) {
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

  const { error } = await useFetch('/api/auth/login', {
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
    } else if (message === 'User not found') {
      title = i18n.t('auth.auth_error_not_found')
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

async function onCreateSubmit (event: FormSubmitEvent<Schema>) {
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

  const { error } = await useFetch('/api/auth/signup', {
    method: 'POST',
    body: {
      name: data.data.username,
      password: data.data.password
    }
  })

  if (error.value) {
    const { message } = error.value.data
    let title = i18n.t('auth.auth_error')

    if (message === 'User already exists') {
      title = i18n.t('auth.auth_already_exists')
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
    <UTabs :items="items">
      <template #login>
        <UForm :schema="schema" :state="loginState" class="flex flex-col items-center gap-2 pt-2 px-2 space-y-4" @submit="onLoginSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <UFormGroup :label="$t('auth.name')" name="username" eager-validation>
              <UInput
                v-model="loginState.username"
                :placeholder="$t('auth.john')"
                variant="outline"
                size="md"
              />
            </UFormGroup>

            <UFormGroup :label="$t('auth.password')" name="password" eager-validation>
              <UInput
                v-model="loginState.password"
                placeholder="********"
                size="md"
                type="password"
              />
            </UFormGroup>
          </div>

          <UButton
            type="submit"
            variant="outline"
            class="w-1/2 md:w-1/3 lg:w-1/4"
            size="md"
            :disabled="isLoginDisabled"
          >
            {{ $t('auth.login') }}
          </UButton>
        </UForm>
      </template>

      <template #create>
        <UForm :schema="schema" :state="createState" class="flex flex-col items-center gap-2 pt-2 px-2 space-y-4" @submit="onCreateSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <UFormGroup :label="$t('auth.name')" name="username" eager-validation>
              <UInput
                v-model="createState.username"
                :placeholder="$t('auth.john')"
                variant="outline"
                size="md"
              />
            </UFormGroup>

            <UFormGroup :label="$t('auth.password')" name="password" eager-validation>
              <UInput
                v-model="createState.password"
                placeholder="********"
                size="md"
                type="password"
              />
            </UFormGroup>
          </div>

          <UButton
            type="submit"
            variant="outline"
            class="w-1/2 md:w-1/3"
            size="md"
            :disabled="isCreateDisabled"
          >
            {{ $t('auth.create') }}
          </UButton>
        </UForm>
      </template>
    </UTabs>
  </UCard>
</template>
