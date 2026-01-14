<script setup lang="ts">
import type { Locale } from '#shared/locale';
import type { DraftTask, EntitySelection } from './model';
import type { TaskLocaleMode } from './task-rules';
import Sortable from 'sortablejs';
import { getTaskReadinessChip } from './task-rules';

const props = defineProps<{
  tasks: DraftTask[];
  selection: EntitySelection;
  activeLocale: Locale;
  taskLocaleMode: TaskLocaleMode;
}>();

const emit = defineEmits<{
  select: [selection: EntitySelection];
  addTask: [];
  reorder: [clientIds: number[]];
  removeTask: [clientId: number];
}>();

const { t } = useI18n();

function deleteTask(clientId: number) {
  emit('removeTask', clientId);
}

function getTaskLabel(task: DraftTask, index: number) {
  const mode = props.taskLocaleMode;
  const locale = mode.kind === 'dual' ? props.activeLocale : mode.locale;
  const title = task.translations[locale].title.trim() || task.translations.en.title.trim();
  return title || `Task ${index + 1}`;
}

const taskItems = computed(() => {
  return props.tasks.map((task, index) => {
    const selected = props.selection.kind === 'task' && props.selection.clientId === task.clientId;

    return {
      clientId: task.clientId,
      selected,
      label: getTaskLabel(task, index),
      regex: task.regex.trim() || 'regex: (empty)',
      chip: getTaskReadinessChip(task, props.taskLocaleMode),
    };
  });
});

const container = ref<HTMLElement | null>(null);
const sortable = shallowRef<Sortable | null>(null);

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) {
    return items;
  }

  const next = items.slice();
  const [item] = next.splice(fromIndex, 1);
  if (item === undefined) {
    return items;
  }

  next.splice(toIndex, 0, item);
  return next;
}

function initSortable() {
  if (!container.value) {
    return;
  }

  sortable.value?.destroy();

  sortable.value = new Sortable(container.value, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'opacity-50',
    onEnd: ({ oldIndex, newIndex }) => {
      if (oldIndex === undefined || newIndex === undefined) {
        return;
      }

      const current = props.tasks.map(task => task.clientId);
      const reordered = moveItem(current, oldIndex, newIndex);
      emit('reorder', reordered);
    },
  });
}

onMounted(initSortable);

watch(() => props.tasks.length, initSortable);

onBeforeUnmount(() => {
  sortable.value?.destroy();
  sortable.value = null;
});
</script>

<template>
  <div>
    <UPageCard :ui="{ container: 'overflow-hidden' }">
      <template #title>
        <div class="flex items-center justify-between">
          <div class="font-semibold">
            {{ t('topic.editor.sidebar.outline') }}
          </div>

          <UButton
            color="primary"
            variant="subtle"
            icon="i-lucide-plus"
            @click="emit('addTask')"
          >
            {{ t('topic.editor.sidebar.addTask') }}
          </UButton>
        </div>
      </template>

      <USeparator />

      <div class="flex min-w-0 flex-col gap-4 lg:max-h-[calc(max(500px,100vh-var(--ui-content-offset)))]">
        <UButton
          :variant="selection.kind === 'topic' ? 'subtle' : 'ghost'"
          :color="selection.kind === 'topic' ? 'primary' : 'neutral'"
          icon="i-lucide-settings"
          :ui="{ base: 'text-left py-2' }"
          @click="emit('select', { kind: 'topic' })"
        >
          {{ t('topic.editor.sidebar.topicSettings') }}
        </UButton>

        <USeparator />

        <div ref="container" class="flex flex-col gap-1 overflow-y-auto">
          <UButton
            v-for="item in taskItems"
            :key="item.clientId"
            as="div"
            :variant="item.selected ? 'subtle' : 'ghost'"
            :color="item.selected ? 'primary' : 'neutral'"
            @click="emit('select', { kind: 'task', clientId: item.clientId })"
          >
            <template #leading>
              <UIcon class="drag-handle" name="i-lucide-grip-vertical" />
            </template>

            <div class="min-w-0 flex-1 text-left">
              <p class="truncate font-medium">
                {{ item.label }}
              </p>

              <p class="truncate text-sm text-neutral-500 font-mono">
                {{ item.regex }}
              </p>
            </div>

            <template #trailing>
              <div class="flex items-center gap-2">
                <UBadge variant="subtle" :color="item.chip.color">
                  {{ item.chip.label }}
                </UBadge>

                <UPopover v-if="tasks.length > 1" arrow>
                  <UTooltip :text="t('topic.editor.sidebar.removeTask')">
                    <UButton
                      type="button"
                      variant="ghost"
                      color="error"
                      size="xs"
                      icon="i-lucide-trash"
                      @click.stop
                    />
                  </UTooltip>

                  <template #content="{ close }">
                    <UCard :ui="{ body: 'flex flex-col gap-4' }">
                      <div class="font-semibold">
                        {{ t('topic.editor.sidebar.removeTaskConfirmTitle') }}
                      </div>

                      <div class="text-sm text-neutral-600 dark:text-neutral-300">
                        {{ t('topic.editor.sidebar.removeTaskConfirmMessage') }}
                      </div>

                      <div class="flex justify-end gap-2">
                        <UButton
                          variant="ghost"
                          color="neutral"
                          @click="close"
                        >
                          {{ t('topic.editor.cancel') }}
                        </UButton>
                        <UButton
                          variant="solid"
                          color="error"
                          @click="() => { close(); deleteTask(item.clientId); }"
                        >
                          {{ t('topic.editor.confirm') }}
                        </UButton>
                      </div>
                    </UCard>
                  </template>
                </UPopover>

                <UTooltip v-else :text="t('topic.editor.sidebar.cannotRemoveLastTask')">
                  <UButton
                    type="button"
                    variant="ghost"
                    color="error"
                    size="xs"
                    icon="i-lucide-trash"
                    disabled
                  />
                </UTooltip>
              </div>
            </template>
          </UButton>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
