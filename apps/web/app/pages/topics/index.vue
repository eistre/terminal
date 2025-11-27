<script setup lang="ts">
import { topics } from '#shared/seed';
import TopicCard from '~/components/topic/TopicCard.vue';
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="$t('topics.title')"
        :description="$t('topics.description')"
      />

      <UPageBody>
        <UPageGrid>
          <TopicCard
            v-for="topic in topics"
            :key="topic.id"
            :topic="topic"
          />
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
