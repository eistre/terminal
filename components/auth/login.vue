// https://ui.nuxt.com/forms/form
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const schema = z.object({
  name: z.string({ required_error: 'Sisestage oma nimi' })
    .min(1, 'Sisestage oma nimi'),
  matriculation: z.string({ required_error: 'Sisestage korrektne matrikkel' })
    .regex(/^[A-ZÕÜÖÄ]\d+$/, 'Sisestage korrektne matrikkel')
})

type Schema = z.output<typeof schema>

const state = reactive({
  name: undefined,
  matriculation: undefined
})

const isDisabled = computed(() => !schema.safeParse(state).success)

function onSubmit (event: FormSubmitEvent<Schema>) {
  // TODO create pod
}
</script>

<template>
  <UCard>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <div class="flex gap-4">
        <UFormGroup label="Nimi" name="name">
          <UInput
            v-model="state.name"
            placeholder="Juhan"
            variant="outline"
            size="md"
          />
        </UFormGroup>

        <UFormGroup label="Matrikkel" name="matriculation">
          <UInput
            v-model="state.matriculation"
            placeholder="X00000"
            size="md"
          />
        </UFormGroup>
      </div>

      <div class="flex justify-center">
        <UButton
          type="submit"
          variant="outline"
          size="md"
          :disabled="!isDisabled"
        >
          Logi sisse
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
