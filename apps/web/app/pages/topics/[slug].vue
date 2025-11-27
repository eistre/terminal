<script setup lang="ts">
import { topicData } from '#shared/seed';
import TerminalCard from '~/components/terminal/TerminalCard.vue';
import TasksCard from '~/components/topic/TasksCard.vue';

const route = useRoute();
const slug = route.params.slug as string;

const topic = computed(() => topicData[slug]);
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="topic?.title"
        :description="topic?.description"
      />

      <UPageBody>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <TasksCard :tasks="topic?.tasks ?? []" class="lg:col-span-1" />
          <TerminalCard class="lg:col-span-2" />
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
