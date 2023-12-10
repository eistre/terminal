<script setup lang="ts">
definePageMeta({
  middleware: 'protected'
})

const { data: exercises, error } = await useFetch('/api/exercises', { method: 'GET' })

const user = useAuthenticatedUser()
const toast = useToast()

if (error.value) {
  toast.add({
    id: 'exercises_failed',
    icon: 'i-heroicons-x-mark',
    title: error.value.statusMessage,
    description: error.value.data.message,
    timeout: 5000,
    color: 'red'
  })
}

const ui = {
  base: 'flex flex-col justify-between',
  header: { base: 'bg-gray-50 dark:bg-gray-900/25', padding: 'px-4 py-4 sm:px-4' },
  body: { base: 'bg-gray-50 dark:bg-gray-900/25', padding: 'px-4 py-4 sm:p-4' },
  footer: { base: 'bg-gray-50 dark:bg-gray-900/25', padding: 'px-4 py-4 sm:px-4' }
}

function deleteExercise (id: number) {
  const index = exercises.value?.findIndex(exercise => exercise.id === id)

  if (index) {
    exercises.value?.splice(index, 1)
  }
}
</script>

<template>
  <UContainer>
    <UCard :ui="{ ring: '', shadow: '' }">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-3xl font-semibold">Harjutused</span>
          <UButton
            v-if="user.role === 'ADMIN'"
            variant="outline"
            size="lg"
          >
            Loo uus
          </UButton>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UCard
          v-for="exercise in exercises"
          :key="exercise.id"
          :ui="ui"
          class="hover:ring-primary-600/90 hover:divide-primary-600/90 dark:hover:ring-primary-900/90 dark:hover:divide-primary-900/90"
        >
          <template #header>
            <div class="flex justify-between items-center">
              <ULink
                :to="`/exercises/${exercise.id}`"
                class="font-semibold text-primary"
              >
                {{ exercise.title }}
              </ULink>
              <UProgress
                v-if="exercise.tasks > 0"
                class="flex w-2/5 md:w-1/3"
                :value="exercise.progress"
                indicator
              />
            </div>
          </template>

          {{ exercise.description }}

          <template v-if="user.role === 'ADMIN'" #footer>
            <div class="flex justify-end items-center gap-2">
              <ExerciseEditButton />
              <ExerciseDeleteButton :id="exercise.id" @delete="deleteExercise(exercise.id)" />
            </div>
          </template>
        </UCard>
      </div>
    </UCard>
  </UContainer>
</template>
