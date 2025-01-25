<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

type Domain = {
  name: string
  verified: boolean
  hidden: boolean
}

const schema = computed(() => {
  return z.object({
    name: z.string({ required_error: i18n.t('domain.enter_name') })
      .min(1, i18n.t('domain.enter_name'))
      .regex(/^.+\..+$/, i18n.t('domain.enter_name')),
    verified: z.boolean(),
    hidden: z.boolean()
  })
})

type Schema = z.output<typeof schema.value>

const state = reactive({
  name: undefined,
  verified: true,
  hidden: true
})

const domains = ref<Domain[]>([])

const toast = useToast()
const i18n = useI18n()

const columns = [{
  key: 'name',
  label: i18n.t('domain.name'),
  sortable: true
}, {
  key: 'verified',
  label: i18n.t('domain.verification'),
  sortable: true
}, {
  key: 'hidden',
  label: i18n.t('domain.hidden'),
  sortable: true
}, {
  key: 'delete'
}]

const fetchDomains = async () => {
  try {
    const data = await $fetch('/api/auth/email/domains')
    domains.value = data?.domains ?? []
  } catch (error) {
    toast.add({
      id: 'domains_failed',
      icon: 'i-heroicons-x-mark',
      title: i18n.t('auth.domains_failed'),
      timeout: 5000,
      color: 'red'
    })
  }
}

const deleteDomain = async (name: string) => {
  try {
    await $fetch('/api/auth/email/domains', {
      method: 'DELETE',
      body: { name }
    })

    toast.add({
      id: `domain_delete_success_${name}`,
      icon: 'i-heroicons-check',
      title: i18n.t('domain.delete_success'),
      timeout: 5000,
      color: 'green'
    })
  } catch (error) {
    toast.add({
      id: `domain_delete_failed_${name}`,
      icon: 'i-heroicons-x-mark',
      title: i18n.t('domain.delete_error'),
      timeout: 5000,
      color: 'red'
    })
  }

  await fetchDomains()
}

async function onDomainSubmit (event: FormSubmitEvent<Schema>) {
  const data = schema.value.safeParse(event.data)

  if (!data.success) {
    toast.add({
      id: 'domain_failed',
      icon: 'i-heroicons-x-mark',
      title: data.error.name,
      description: data.error.message,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  try {
    await $fetch('/api/auth/email/domains', {
      method: 'POST',
      body: {
        name: data.data.name,
        verified: !data.data.verified,
        hidden: data.data.hidden
      }
    })

    toast.add({
      id: 'domain_success',
      icon: 'i-heroicons-check',
      title: i18n.t('domain.success'),
      timeout: 5000,
      color: 'green'
    })
  } catch (error: any) {
    const { message } = error.data
    let title = i18n.t('domain.domain_error')

    if (message === 'User already exists') {
      title = i18n.t('domain.domain_already_exists')
    }

    toast.add({
      id: 'domain_failed',
      icon: 'i-heroicons-x-mark',
      title,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  state.name = undefined
  state.verified = true
  state.hidden = true
  await fetchDomains()
}

fetchDomains()
</script>

<template>
  <ClientOnly>
    <div class="flex flex-col gap-4">
      <UForm :schema="schema" :state="state" class="flex items-center justify-around gap-2" @submit="onDomainSubmit">
        <UFormGroup name="name" eager-validation>
          <UInput
            v-model="state.name"
            :placeholder="$t('domain.name')"
            variant="outline"
            size="md"
          />
        </UFormGroup>

        <UCheckbox
          v-model="state.verified"
          :label="$t('domain.verification')"
        />

        <UCheckbox
          v-model="state.hidden"
          :label="$t('domain.hidden')"
        />

        <UButton
          type="submit"
          variant="outline"
          size="md"
        >
          {{ $t('domain.add') }}
        </UButton>
      </UForm>

      <UDivider />

      <UTable :columns="columns" :rows="domains" class="max-h-96 overflow-y-auto">
        <template #verified-data="{ row }">
          <UIcon class="h-6 w-6" :name="row.verified ? 'i-heroicons-x-mark-solid' : 'i-heroicons-check-solid'" />
        </template>

        <template #hidden-data="{ row }">
          <UIcon class="h-6 w-6" :name="row.hidden ? 'i-heroicons-check-solid' : 'i-heroicons-x-mark-solid'" />
        </template>

        <template #delete-data="{ row }">
          <UButton
            icon="i-heroicons-trash-solid"
            color="red"
            variant="ghost"
            size="xl"
            @click="deleteDomain(row.name)"
          />
        </template>
      </UTable>
    </div>
  </ClientOnly>
</template>
