<script setup lang="ts">
import type { Task } from '#shared/seed';
import type { AccordionItem } from '#ui/components/Accordion.vue';

const { tasks } = defineProps<{ tasks: Task[] }>();
const { t } = useI18n();

const visibleHints = ref<Set<number>>(new Set());
const items: ComputedRef<(AccordionItem & { hint?: string })[]> = computed(() => {
  return tasks.map(task => ({
    id: task.id,
    label: task.title,
    icon: task.completed ? 'i-lucide-circle-check-big' : 'i-lucide-circle-minus',
    content: task.content,
    hint: task.hint,
    ui: {
      trigger: task.completed
        ? 'rounded-md text-success bg-success/10 hover:bg-success/15'
        : 'rounded-md text-neutral hover:bg-neutral-100 dark:hover:bg-neutral-100/10',
    },
  }));
});

function toggleHint(item: number) {
  if (visibleHints.value.has(item)) {
    visibleHints.value.delete(item);
  }
  else {
    visibleHints.value.add(item);
  }
}
</script>

<template>
  <div>
    <UPageCard :title="$t('topic.tasks')">
      <USeparator />
      <UAccordion
        type="multiple"
        :items="items"
        :ui="{ header: 'my-0.5', trigger: 'p-2.5 font-semibold' }"
        class="overflow-y-auto lg:max-h-[calc(100vh-36rem)]"
      >
        <template #body="{ item }">
          <div class="p-2.5 space-y-2">
            <div class="text-muted">
              {{ item.content }}
            </div>

            <div v-if="item.hint" class="space-y-2">
              <UButton
                variant="subtle"
                size="xs"
                color="neutral"
                @click="toggleHint(item.id)"
              >
                {{ visibleHints.has(item.id) ? t('topic.hideHint') : t('topic.showHint') }}
              </UButton>
              <div v-if="visibleHints.has(item.id)" class="p-3 border rounded-md bg-muted">
                {{ item.hint }}
              </div>
            </div>
          </div>
        </template>
      </UAccordion>
    </UPageCard>
  </div>
</template>
