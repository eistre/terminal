// https://ui.nuxt.com/forms/form
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const schema = z.object({
  username: z.string({ required_error: 'Sisestage oma nimi' })
    .min(1, 'Sisestage oma nimi'),
  password: z.string({ required_error: 'Sisestage parool' })
    .min(8, 'Parool peab olema vähemalt 8 sümbolit pikk')
})

type Schema = z.output<typeof schema>

const state = reactive({
  username: undefined,
  password: undefined
})

const isDisabled = computed(() => !schema.safeParse(state).success)

async function onSubmit (event: FormSubmitEvent<Schema>) {
  const data = schema.safeParse(event.data)

  if (!data.success) {
    // TODO
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
    // TODO
    return
  }

  await navigateTo('/terminal')
}
</script>

<template>
  <UCard class="w-1/2">
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <div class="flex gap-4 w-full">
        <UFormGroup label="Nimi" name="username" class="w-1/2">
          <UInput
            v-model="state.username"
            placeholder="Juhan"
            variant="outline"
            size="md"
          />
        </UFormGroup>

        <UFormGroup label="Parool" name="password" class="w-1/2">
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
          Alusta
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
