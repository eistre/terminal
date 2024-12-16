// templates and snippets from https://ui.nuxt.com/forms/form
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { computed } from 'vue'

const i18n = useI18n()
const toast = useToast()
const user = useUser()

const items = computed(() => {
  return [{
    slot: 'login',
    label: i18n.t('auth.login')
  }, {
    slot: 'create',
    label: i18n.t('auth.create')
  }]
})

const { data, error } = await useFetch('/api/auth/email/domains')

if (error.value) {
  toast.add({
    id: 'domains_failed',
    icon: 'i-heroicons-x-mark',
    title: i18n.t('auth.domains_failed'),
    timeout: 5000,
    color: 'red'
  })
}

const domains = data.value?.domains
const loginSchema = computed(() => {
  return z.object({
    email: z.string({ required_error: i18n.t('auth.enter_email') })
      .email(i18n.t('auth.enter_email'))
      .refine(email => domains?.some(suffix => email.endsWith(suffix.name)), i18n.t('auth.valid_email'))
      .or(z.string().regex(/^admin$/)),
    password: z.string({ required_error: i18n.t('auth.enter_password') })
      .min(8, i18n.t('auth.password_error'))
  })
})
const createSchema = computed(() => {
  return z.object({
    email: z.string({ required_error: i18n.t('auth.enter_email') })
      .email(i18n.t('auth.enter_email'))
      .refine(email => domains?.some(suffix => email.endsWith(suffix.name)), i18n.t('auth.valid_email'))
      .or(z.string().regex(/^admin$/)),
    name: z.string({ required_error: i18n.t('auth.enter_name') })
      .min(1, i18n.t('auth.enter_name')),
    password: z.string({ required_error: i18n.t('auth.enter_password') })
      .min(8, i18n.t('auth.password_error'))
  })
})

type LoginSchema = z.output<typeof loginSchema.value>
type CreateSchema = z.output<typeof createSchema.value>

const loginState = reactive({
  email: undefined,
  password: undefined
})
const createState = reactive({
  email: undefined,
  name: undefined,
  password: undefined
})

const isLoginDisabled = computed(() => !loginSchema.value.safeParse(loginState).success)
const isCreateDisabled = computed(() => !createSchema.value.safeParse(createState).success)

const visibleDomains = computed(() => {
  const visibleDomains = domains?.filter(domain => !domain.hidden)

  const length = visibleDomains?.length
  if (!length || length === 0) {
    return undefined
  }

  const text = visibleDomains.map(domain => domain.name).join(', ')
  return `${i18n.t('auth.only')} ${text} ${i18n.t('auth.are_allowed')}`
})

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

  try {
    await $fetch('/api/auth/email/login', {
      method: 'POST',
      body: {
        email: data.data.email,
        password: data.data.password
      }
    })
  } catch (error: any) {
    const { message } = error.data
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

  navigateTo('/exercises')
}

async function onCreateSubmit (event: FormSubmitEvent<CreateSchema>) {
  const data = createSchema.value.safeParse(event.data)

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

  try {
    await $fetch('/api/auth/email/signup', {
      method: 'POST',
      body: {
        email: data.data.email,
        name: data.data.name,
        password: data.data.password
      }
    })
  } catch (error: any) {
    const { message } = error.data
    let title = i18n.t('auth.auth_error')

    if (message === 'User already exists') {
      title = i18n.t('auth.auth_already_exists')
    }

    toast.add({
      id: 'auth_login_failed',
      icon: 'i-heroicons-x-mark',
      title,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  await fetchUser()

  if (user.value?.role !== 'UNVERIFIED') {
    await navigateTo('/exercises')
  }
}
</script>

<template>
  <UCard class="w-1/2">
    <AuthVerification v-if="user?.role === 'UNVERIFIED'" />

    <UTabs v-else :items="items">
      <template #login>
        <UForm :schema="loginSchema" :state="loginState" class="flex flex-col items-center gap-4 pt-2 px-2 space-y-4" @submit="onLoginSubmit">
          <div class="flex flex-col gap-4 w-full md:w-2/3">
            <UFormGroup label="Email" name="email" eager-validation>
              <UInput
                v-model="loginState.email"
                :placeholder="$t('auth.email')"
                variant="outline"
                size="md"
              />

              <template #hint>
                <UPopover v-if="visibleDomains" :popper="{ placement: 'top'}" mode="hover">
                  <UIcon name="i-heroicons-information-circle" />

                  <template #panel>
                    <div class="p-2 text-center max-w-60">
                      {{ visibleDomains }}
                    </div>
                  </template>
                </UPopover>
              </template>
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
        <UForm :schema="createSchema" :state="createState" class="flex flex-col items-center gap-4 pt-2 px-2 space-y-4" @submit="onCreateSubmit">
          <div class="flex flex-col gap-4 w-full md:w-2/3">
            <UFormGroup label="Email" name="email" eager-validation>
              <UInput
                v-model="createState.email"
                :placeholder="$t('auth.email')"
                variant="outline"
                size="md"
              />

              <template #hint>
                <UPopover v-if="visibleDomains" :popper="{ placement: 'top'}" mode="hover">
                  <UIcon name="i-heroicons-information-circle" />

                  <template #panel>
                    <div class="p-2 text-center max-w-60">
                      {{ visibleDomains }}
                    </div>
                  </template>
                </UPopover>
              </template>
            </UFormGroup>

            <UFormGroup :label="$t('auth.name')" name="name" eager-validation>
              <UInput
                v-model="createState.name"
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
