<script setup lang="ts">
import XtermTerminal from '~/components/terminal/XtermTerminal.vue';
import TasksCard from '~/components/topic/TasksCard.vue';

definePageMeta({ middleware: ['require-session'] });

const { t, locale } = useI18n();
const toast = useToast();
const route = useRoute();
const slug = route.params.slug as string;

const terminal = ref<InstanceType<typeof XtermTerminal>>();
const {
  attach,
  connect,
  reset,
  resetTasks,
  sessionStatus,
  canReconnect,
  lastTaskDoneId,
} = useTerminalSession(slug);

const hasEverConnected = ref(false);
const hasInitializedActiveTasks = ref(false);
const activeTaskIds = ref<string[]>([]);
const canReset = computed(() => {
  const status = sessionStatus.value;

  if (status === 'RESETTING' || status === 'CONNECTING') {
    return false;
  }

  return status === 'READY' || status === 'ERROR' || status === 'CLOSED';
});

const { data: topic, status, error } = await useFetch(`/api/topics/${slug}`, {
  method: 'GET',
  deep: true,
  query: {
    locale,
  },
});

watch(topic, (value) => {
  if (!value || hasInitializedActiveTasks.value) {
    return;
  }

  hasInitializedActiveTasks.value = true;

  const firstIncomplete = value.tasks.find(task => !task.completed);
  if (!firstIncomplete) {
    return;
  }

  const id = String(firstIncomplete.id);
  if (!activeTaskIds.value.includes(id)) {
    activeTaskIds.value.push(id);
  }
}, { immediate: true });

watch(lastTaskDoneId, (newTaskId) => {
  if (newTaskId === null) {
    return;
  }

  for (const task of topic.value?.tasks ?? []) {
    if (task.id === newTaskId) {
      task.completed = true;
      break;
    }
  }

  const completedId = String(newTaskId);
  activeTaskIds.value = activeTaskIds.value.filter(id => id !== completedId);

  const nextIncomplete = topic.value?.tasks.find(task => !task.completed);
  if (nextIncomplete) {
    const nextId = String(nextIncomplete.id);
    if (!activeTaskIds.value.includes(nextId)) {
      activeTaskIds.value.push(nextId);
    }
  }

  lastTaskDoneId.value = null;
});

watch(status, (newStatus) => {
  if (newStatus === 'error' && error.value) {
    toast.add({
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('topic.topicError'),
    });

    navigateTo('/topics');
  }
}, { immediate: true });

watch(sessionStatus, (newStatus) => {
  if (newStatus === 'READY') {
    hasEverConnected.value = true;
  }
});

function handleTerminalReady() {
  if (terminal.value) {
    attach(terminal.value);
    connect();
  }
}

async function handleContainerReset() {
  try {
    reset();
    await $fetch('/api/terminal', { method: 'DELETE' });
    connect();
  }
  catch {
    toast.add({
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('terminal.resetTerminalError'),
    });
  }
}

async function handleTasksReset() {
  try {
    await $fetch(`/api/topics/${slug}/reset`, { method: 'DELETE' });
    resetTasks();
    topic.value?.tasks.forEach(task => task.completed = false);

    const firstIncomplete = topic.value?.tasks.find(task => !task.completed);
    if (firstIncomplete) {
      activeTaskIds.value = [String(firstIncomplete.id)];
    }

    toast.add({
      color: 'success',
      icon: 'i-lucide-check-circle',
      title: t('topic.resetTasksSuccess'),
    });
  }
  catch {
    toast.add({
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('topic.resetTasksError'),
    });
  }
}
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
          <TasksCard
            v-model:active="activeTaskIds"
            :tasks="topic?.tasks ?? []"
            class="lg:col-span-1"
            @reset="handleTasksReset"
          />
          <UPageCard class="lg:col-span-2" :ui="{ body: 'w-full' }">
            <template #title>
              <div class="flex justify-between items-center">
                {{ $t('topic.terminal') }}
                <div class="flex gap-1.5">
                  <UButton
                    v-if="canReconnect"
                    variant="ghost"
                    color="neutral"
                    @click="connect"
                  >
                    {{ $t('topic.reconnect') }}
                  </UButton>
                  <UButton
                    variant="ghost"
                    color="neutral"
                    :loading="hasEverConnected && !canReset"
                    :disabled="!canReset"
                    @click="handleContainerReset"
                  >
                    {{ $t('topic.resetTerminal') }}
                  </UButton>
                </div>
              </div>
            </template>

            <USeparator />

            <div class="bg-black rounded-lg p-4 terminal-height">
              <XtermTerminal ref="terminal" @ready="handleTerminalReady" />
            </div>
          </UPageCard>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
