<script setup lang="ts">
import TopicCard from '~/components/topic/TopicCard.vue';

const toast = useToast();
const { t, locale } = useI18n();

const { data: topics, status, error } = await useFetch('/api/topics', {
  method: 'GET',
  deep: true,
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

function handleDeleted(id: number) {
  if (!topics.value) {
    return;
  }

  const index = topics.value.findIndex(topic => topic.id === id);
  if (index >= 0) {
    topics.value.splice(index, 1);
  }
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="$t('topics.title')"
        :description="$t('topics.description')"
        :links="[{
          label: $t('topics.new'),
          icon: 'i-lucide-edit',
          size: 'lg',
          to: '/topics/new',
        }]"
      />

      <UPageBody>
        <UPageGrid>
          <TopicCard
            v-for="topic in topics"
            :key="topic.id"
            :topic="topic"
            @deleted="handleDeleted"
          />
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
