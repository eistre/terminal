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

type Exercise = {
  id: number
  title: string
  description: string
  tasks: Task[]
}

definePageMeta({
  middleware: 'admin'
})

const toast = useToast()
const route = useRoute()
const i18n = useI18n()
const exerciseId = route.params.id
const { data, error } = await useFetch(`/api/exercises/edit/${exerciseId}`, { method: 'GET' })

if (error.value) {
  toast.add({
    id: `exercise_failed_${exerciseId}`,
    icon: 'i-heroicons-x-mark',
    title: i18n.t('exercises.exercise_error'),
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

const exercise = data.value as Exercise

const title = exercise.title
const keyCount = ref(0)
const state = reactive({
  title: exercise.title,
  description: exercise.description,
  tasks: exercise.tasks.map(task => ({ ...task, key: keyCount.value++ })) as (Task & { key: number })[],
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

const tasks = computed(() => state.tasks.map((task, index) => ({ ...task, label: `${i18n.t('exercises.edit.task')} ${index + 1}` })))

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
      id: `edit_exercise_failed_${exerciseId}`,
      icon: 'i-heroicons-x-mark',
      title: body.error.name,
      description: body.error.message,
      timeout: 5000,
      color: 'red'
    })
    return
  }

  try {
    await $fetch(`/api/exercises/edit/${exerciseId}`, {
      method: 'POST',
      body: body.data
    })
  } catch (error) {
    toast.add({
      id: `edit_exercise_failed_${exerciseId}`,
      icon: 'i-heroicons-x-mark',
      title: i18n.t('exercises.edit.update_fail'),
      timeout: 5000,
      color: 'red'
    })
    return
  }

  await navigateTo('/exercises')

  toast.add({
    id: `create_exercise_success_${exerciseId}`,
    icon: 'i-heroicons-check',
    title: i18n.t('exercises.edit.update_success'),
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
                {{ $t('exercises.edit.add_task') }}
              </UButton>

              <UTooltip
                :prevent="!isDisabled"
                :text="state.tasks.length > 0 ? $t('exercises.edit.save_error1') : $t('exercises.edit.save_error2')"
                :popper="{ arrow: true, placement: 'bottom' }"
              >
                <UButton
                  type="submit"
                  variant="outline"
                  size="lg"
                  :disabled="isDisabled"
                  :color="isDisabled ? 'red' : 'primary'"
                >
                  {{ $t('exercises.edit.save') }}
                </UButton>
              </UTooltip>
            </div>
          </div>
        </template>

        <UCard>
          <div class="grid grid-cols-1 gap-6">
            <UFormGroup :label="$t('exercises.edit.title')" name="title" :error="state.title ? false : $t('exercises.edit.title_error')">
              <UInput
                v-model="state.title"
                :placeholder="$t('exercises.edit.exercise')"
                variant="outline"
              />
            </UFormGroup>

            <UFormGroup :label="$t('exercises.edit.description')" name="description" :error="state.description ? false : $t('exercises.edit.description_error')">
              <UTextarea
                v-model="state.description"
                :placeholder="$t('exercises.edit.description_placeholder')"
              />
            </UFormGroup>

            <UAccordion :items="tasks" multiple default-open>
              <template #item="{ item, index }">
                <div class="p-2 grid grid-cols-2 gap-4">
                  <div class="flex flex-col gap-2">
                    <UFormGroup :label="$t('exercises.edit.task_name')" :error="item.title ? false : $t('exercises.edit.task_name_error')">
                      <UInput
                        v-model="state.tasks[index].title"
                        :placeholder="$t('exercises.edit.task_name')"
                      />
                    </UFormGroup>

                    <UFormGroup
                      label="Regex"
                      :error="item.regex ? false : $t('exercises.edit.task_regex_error')"
                    >
                      <template #description>
                        <div class="flex justify-between">
                          {{ $t('exercises.edit.task_regex_description') }}
                          <UPopover mode="hover">
                            <UIcon name="i-heroicons-information-circle-solid" />

                            <template #panel>
                              <div class="p-2 w-72">
                                {{ $t('exercises.edit.task_regex_hint') }}
                                <NuxtLink class="text-primary" to="https://linux.die.net/man/7/inotify" target="_blank">
                                  {{ $t('exercises.edit.task_regex_link') }}
                                </NuxtLink>
                              </div>
                            </template>
                          </UPopover>
                        </div>
                      </template>

                      <UInput
                        v-model="state.tasks[index].regex"
                        placeholder="Regex"
                      />
                    </UFormGroup>

                    <UFormGroup
                      :label="$t('exercises.edit.task_hint')"
                      :description="$t('exercises.edit.task_hint_description')"
                    >
                      <UInput
                        v-model="state.tasks[index].hint"
                        :placeholder="$t('exercises.edit.task_hint')"
                      />
                    </UFormGroup>
                  </div>

                  <div class="flex flex-col justify-between gap-2">
                    <UFormGroup :label="$t('exercises.edit.task_content')" :error="item.content ? false : $t('exercises.edit.task_content_error')">
                      <UTextarea
                        v-model="state.tasks[index].content"
                        :placeholder="$t('exercises.edit.task_content_placeholder')"
                        :rows="7"
                      />
                    </UFormGroup>

                    <div class="w-full flex justify-end">
                      <UTooltip
                        :text="$t('exercises.edit.delete')"
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
