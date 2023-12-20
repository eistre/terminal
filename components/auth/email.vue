// https://ui.nuxt.com/forms/form
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { computed } from 'vue'

const i18n = useI18n()
const user = useUser()

const active = ref(0)
const items = computed(() => {
  return [{
    slot: 'login',
    label: i18n.t('auth.login')
  }, {
    slot: 'create',
    label: i18n.t('auth.create'),
    disabled: isLoginDisabled.value || loginChanged.value
  }]
})

const valid = ['@ut.ee', '@tlu.ee', '@taltech.ee', '@edu.ee']
const loginSchema = computed(() => {
  return z.object({
    email: z.string({ required_error: i18n.t('auth.enter_email') })
      .email(i18n.t('auth.enter_email'))
      .refine(email => valid.some(suffix => email.endsWith(suffix)), i18n.t('auth.valid_email'))
      .or(z.string().regex(/^admin$/)),
    password: z.string({ required_error: i18n.t('auth.enter_password') })
      .min(8, i18n.t('auth.password_error'))
  })
})
const createSchema = computed(() => {
  return z.object({
    username: z.string({ required_error: i18n.t('auth.enter_name') })
      .min(1, i18n.t('auth.enter_name'))
  })
})

type LoginSchema = z.output<typeof loginSchema.value>
type CreateSchema = z.output<typeof createSchema.value>

const loginChanged = ref(true)
const loginState = reactive({
  email: undefined,
  password: undefined
})
const createState = reactive({
  username: undefined
})

watch(loginState, () => {
  loginChanged.value = true
})

const isLoginDisabled = computed(() => !loginSchema.value.safeParse(loginState).success)
const isCreateDisabled = computed(() => !createSchema.value.safeParse(createState).success || loginChanged.value)

const toast = useToast()

async function onLoginSubmit (event: FormSubmitEvent<LoginSchema>) {
  const data = loginSchema.value.safeParse(event.data)

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

  const { error } = await useFetch('/api/auth/email/login', {
    method: 'POST',
    body: {
      email: data.data.email,
      password: data.data.password
    }
  })

  if (error.value) {
    if (error.value.statusCode === 404) {
      loginChanged.value = false
      await nextTick(() => {
        active.value = 1
      })
      return
    }

    toast.add({
      id: 'auth_login_failed',
      icon: 'i-heroicons-x-mark',
      title: i18n.t('auth.auth_error'),
      timeout: 5000,
      color: 'red'
    })
    return
  }

  navigateTo('/exercises')
}
async function onCreateSubmit (event: FormSubmitEvent<CreateSchema>) {
  const usernameData = createSchema.value.safeParse(event.data)
  const loginData = loginSchema.value.safeParse(loginState)

  if (!usernameData.success) {
    toast.add({
      id: 'auth_failed',
      icon: 'i-heroicons-x-mark',
      title: usernameData.error.name,
      description: usernameData.error.message,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  if (!loginData.success) {
    toast.add({
      id: 'auth_failed',
      icon: 'i-heroicons-x-mark',
      title: loginData.error.name,
      description: loginData.error.message,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  const { error } = await useFetch('/api/auth/email/signup', {
    method: 'POST',
    body: {
      name: usernameData.data.username,
      email: loginData.data.email,
      password: loginData.data.password
    }
  })

  if (error.value) {
    toast.add({
      id: 'auth_login_failed',
      icon: 'i-heroicons-x-mark',
      title: i18n.t('auth.auth_error'),
      timeout: 5000,
      color: 'red'
    })
    return
  }

  await fetchUser()
}
</script>

<template>
  <UCard class="w-1/2">
    <AuthVerification v-if="user?.role === 'UNVERIFIED'" />

    <UTabs v-else v-model="active" :items="items">
      <template #login>
        <UForm :schema="loginSchema" :state="loginState" class="pt-2 px-2 space-y-4" @submit="onLoginSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <UFormGroup label="Email" name="email" eager-validation>
              <UInput
                v-model="loginState.email"
                :placeholder="$t('auth.email')"
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

          <div class="flex justify-center">
            <UButton
              type="submit"
              variant="outline"
              class="w-1/4"
              size="md"
              :disabled="isLoginDisabled"
            >
              {{ $t('auth.login') }}
            </UButton>
          </div>
        </UForm>
      </template>

      <template #create>
        <UForm :schema="createSchema" :state="createState" class="pt-2 px-2 space-y-4" @submit="onCreateSubmit">
          <div class="flex justify-center w-full">
            <UFormGroup :label="$t('auth.name')" name="username" eager-validation class="w-full md:w-2/3">
              <UInput
                v-model="createState.username"
                :placeholder="$t('auth.john')"
                variant="outline"
                size="md"
              />
            </UFormGroup>
          </div>

          <div class="flex justify-center">
            <UButton
              type="submit"
              variant="outline"
              class="w-1/3"
              size="md"
              :disabled="isCreateDisabled"
            >
              {{ $t('auth.create') }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UTabs>
  </UCard>
</template>
