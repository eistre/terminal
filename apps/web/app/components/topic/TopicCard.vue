<script setup lang="ts">
import type { TopicSummary } from '@terminal/database';

const { topic } = defineProps<{ topic: TopicSummary }>();
const emit = defineEmits<{ deleted: [id: number] }>();

const toast = useToast();
const { t } = useI18n();

async function deleteTopic() {
  try {
    await $fetch(`/api/admin/topics/${topic.id}`, {
      method: 'DELETE',
    });
    emit('deleted', topic.id);
    toast.add({
      id: `topic-delete-success-${topic.id}`,
      color: 'success',
      icon: 'i-lucide-check-circle',
      title: t('topic.deleteSuccess'),
    });
  }
  catch {
    toast.add({
      id: `topic-delete-failed-${topic.id}`,
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('topic.deleteError'),
    });
  }
}
</script>

<template>
  <UPageCard
    :title="topic.title"
    :description="topic.description"
    :to="`/topics/${topic.slug}`"
    variant="outline"
    spotlight-color="primary"
    :ui="{ root: 'hover:ring-primary hover:ring-2', footer: 'w-full' }"
  >
    <template #footer>
      <div class="flex flex-col gap-2">
        <UProgress
          color="primary"
          status
          :model-value="topic.progress"
        />

        <div class="flex justify-end gap-2 relative z-10">
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-pencil"
            :to="`/topics/${topic.id}/edit`"
          >
            {{ t('topic.editButton') }}
          </UButton>

          <UPopover arrow>
            <UButton
              variant="ghost"
              color="error"
              icon="i-lucide-trash"
            >
              {{ t('topic.deleteButton') }}
            </UButton>

            <template #content="{ close }">
              <UCard :ui="{ body: 'flex flex-col gap-4' }">
                <div class="font-semibold">
                  {{ t('topic.deleteConfirm') }}
                </div>

                <div class="flex justify-center gap-2">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    @click="close"
                  >
                    {{ t('topic.cancel') }}
                  </UButton>
                  <UButton
                    variant="solid"
                    color="error"
                    @click="() => { close(); deleteTopic(); }"
                  >
                    {{ t('topic.confirm') }}
                  </UButton>
                </div>
              </UCard>
            </template>
          </UPopover>
        </div>
      </div>
    </template>
  </UPageCard>
</template>
