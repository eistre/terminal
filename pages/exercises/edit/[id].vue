<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

type Task = {
  id?: number
  title: string | undefined
  content: string | undefined
  hint: string | undefined
  regex: string | undefined
}

definePageMeta({
  middleware: 'admin'
})

const toast = useToast()
const route = useRoute()
const exerciseId = route.params.id
const { data, error } = await useFetch(`/api/exercises/edit/${exerciseId}`, { method: 'GET' })
const title = data.value?.title

if (error.value) {
  toast.add({
    id: 'exercise_failed',
    icon: 'i-heroicons-x-mark',
    title: error.value.statusMessage,
    description: error.value.data.message,
    timeout: 5000,
    color: 'red'
  })

  await navigateTo('/exercises')
}

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  tasks: z.array(
    z.object({
      id: z.number().optional(),
      title: z.string().min(1),
      content: z.string().min(1),
      hint: z.string().optional().nullable(),
      regex: z.string().min(1)
    })
  ).min(1),
  removed: z.array(z.number())
})

type Schema = z.output<typeof schema>

const keyCount = ref(0)
const state = reactive({
  title: data.value?.title,
  description: data.value?.description,
  tasks: data.value?.tasks.map(task => ({ ...task, key: keyCount.value++ })) as (Task & { key: number })[],
  removed: [] as number[]
})

const isDisabled = computed(() => !schema.safeParse(state).success)

function add () {
  state.tasks.push({
    key: keyCount.value++,
    title: undefined,
    content: undefined,
    hint: undefined,
    regex: undefined
  })
}

const tasks = computed(() => state.tasks.map((task, index) => ({ ...task, label: `Ülesanne ${index + 1}` })))

function remove (key: number) {
  const index = state.tasks.findIndex(task => task.key === key)
  const id = state.tasks[index].id

  if (id !== undefined) {
    state.removed.push(id)
  }

  state.tasks.splice(index, 1)
}

async function onSubmit (event: FormSubmitEvent<Schema>) {
  const body = schema.safeParse(event.data)

  if (!body.success) {
    toast.add({
      id: 'edit_exercise_failed',
      icon: 'i-heroicons-x-mark',
      title: body.error.name,
      description: body.error.message,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  const { error } = await useFetch(`/api/exercises/edit/${exerciseId}`, {
    method: 'POST',
    body: body.data
  })

  if (error.value) {
    toast.add({
      id: 'edit_exercise_failed',
      icon: 'i-heroicons-x-mark',
      title: error.value.statusMessage,
      description: error.value.data.message,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  await navigateTo('/exercises')

  toast.add({
    id: 'create_exercise_success',
    icon: 'i-heroicons-check',
    title: 'Exercise updated successfully',
    timeout: 5000,
    color: 'green'
  })
}
</script>

<template>
  <UContainer>
    <UForm :schema="schema" :state="state" @submit="onSubmit">
      <UCard :ui="{ ring: '', shadow: '' }">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="text-3xl font-semibold">{{ title }}</span>
            <div class="flex gap-4">
              <UButton
                variant="outline"
                size="lg"
                @click="add"
              >
                Lisa ülesanne
              </UButton>

              <UTooltip
                :prevent="!isDisabled"
                :text="state.tasks.length > 0 ? 'Kõik vajalikud väljad peavad olema täidetud' : 'Harjutus peab sisaldama vähemalt ühte ülesannet'"
                :popper="{ arrow: true, placement: 'bottom' }"
              >
                <UButton
                  type="submit"
                  variant="outline"
                  size="lg"
                  :disabled="isDisabled"
                  :color="isDisabled ? 'red' : 'primary'"
                >
                  Salvesta
                </UButton>
              </UTooltip>
            </div>
          </div>
        </template>

        <UCard>
          <div class="grid grid-cols-1 gap-6">
            <UFormGroup label="Pealkiri" name="title" :error="state.title ? false : 'Sisestage harjutuse pealkiri'">
              <UInput
                v-model="state.title"
                placeholder="Harjutus"
                variant="outline"
              />
            </UFormGroup>

            <UFormGroup label="Lühikirjeldus" name="description" :error="state.description ? false : 'Sisestage harjutuse lühikirjeldus'">
              <UTextarea
                v-model="state.description"
                placeholder="Linuxi käsurea ülesanded"
              />
            </UFormGroup>

            <UAccordion :items="tasks" multiple default-open>
              <template #item="{ item, index }">
                <div class="p-2 grid grid-cols-2 gap-4">
                  <div class="flex flex-col gap-2">
                    <UFormGroup label="Nimi" :error="item.title ? false : 'Sisestage ülesande nimi'">
                      <UInput
                        v-model="state.tasks[index].title"
                        placeholder="Nimi"
                      />
                    </UFormGroup>

                    <UFormGroup
                      label="Regex"
                      description="Automaatkontrolliks vajalik regex väärtus"
                      :error="item.regex ? false : 'Sisestage ülesannet tuvastav regex'"
                    >
                      <UInput
                        v-model="state.tasks[index].regex"
                        placeholder="Regex"
                      />
                    </UFormGroup>

                    <UFormGroup
                      label="Vihje"
                      description="Valikuline vihje, mida saab kasutada ülesande lahendamiseks"
                    >
                      <UInput
                        v-model="state.tasks[index].hint"
                        placeholder="Vihje"
                      />
                    </UFormGroup>
                  </div>

                  <div class="flex flex-col justify-between gap-2">
                    <UFormGroup label="Kirjeldus" :error="item.content ? false : 'Sisestage ülesande kirjeldus'">
                      <UTextarea
                        v-model="state.tasks[index].content"
                        placeholder="Kuva kausta sisu"
                        :rows="7"
                      />
                    </UFormGroup>

                    <div class="w-full flex justify-end">
                      <UTooltip
                        text="Kustuta"
                        :popper="{ arrow: true, placement: 'bottom' }"
                      >
                        <UButton
                          icon="i-heroicons-trash-solid"
                          variant="ghost"
                          color="red"
                          size="xl"
                          @click="remove(item.key)"
                        />
                      </UTooltip>
                    </div>
                  </div>
                </div>
              </template>
            </UAccordion>
          </div>
        </UCard>
      </UCard>
    </UForm>
  </UContainer>
</template>
