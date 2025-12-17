<script setup lang="ts">
import type { TopicSummary } from '@terminal/database';

const { topic } = defineProps<{ topic: TopicSummary }>();
</script>

<template>
  <UPageCard
    :title="topic.title"
    :description="topic.description"
    :to="`/topics/${topic.slug}`"
    variant="outline"
    spotlight
    spotlight-color="primary"
    :ui="{ root: 'hover:ring-primary hover:ring-2', footer: 'w-full' }"
  >
    <template #footer>
      <UProgress
        color="primary"
        status
        :model-value="topic.progress"
      />
    </template>
  </UPageCard>
</template>
