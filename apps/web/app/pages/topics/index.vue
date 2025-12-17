<script setup lang="ts">
import TopicCard from '~/components/topic/TopicCard.vue';

const toast = useToast();
const { t, locale } = useI18n();

const { data: topics, status, error } = await useFetch('/api/topics', {
  method: 'GET',
  query: {
    locale,
  },
});

watch(status, (newStatus) => {
  if (newStatus === 'error' && error.value) {
    toast.add({
      id: 'topics-error',
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('topics.topicsError'),
    });
  }
});
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
