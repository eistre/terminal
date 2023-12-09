<script setup lang="ts">
definePageMeta({
  middleware: 'protected'
})

const { data: exercises } = await useFetch('/api/exercises', { method: 'GET' })
</script>

<template>
  <UContainer>
    <UCard :ui="{ ring: '', shadow: '' }">
      <template #header>
        <span class="text-3xl font-semibold">Harjutused</span>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UCard
          v-for="exercise in exercises"
          :key="exercise.id"
          :ui="{ body: { padding: 'px-4 py-4 sm:p-4' }, header: { padding: 'px-4 py-4 sm:px-4' } }"
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
        </UCard>
      </div>
    </UCard>
  </UContainer>
</template>
