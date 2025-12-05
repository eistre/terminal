<script setup lang="ts">
import { topicData } from '#shared/seed';
import XtermTerminal from '~/components/terminal/XtermTerminal.vue';
import TasksCard from '~/components/topic/TasksCard.vue';

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const slug = route.params.slug as string;

const terminal = ref<InstanceType<typeof XtermTerminal>>();
const session = useTerminalSession();

const hasEverConnected = ref(false);
const canReset = computed(() => {
  const status = session.sessionStatus.value;

  if (session.sessionStatus.value === 'RESETTING' || session.socketStatus.value === 'CONNECTING') {
    return false;
  }

  return status === 'READY' || status === 'ERROR' || status === 'CLOSED';
});

// TODO replace with actual api call
const topic = topicData[slug];
const computedTopic = computed(() => topic);

watch(session.sessionStatus, (status) => {
  if (status === 'READY') {
    hasEverConnected.value = true;
  }
});

function handleTerminalReady() {
  if (terminal.value) {
    session.attach(terminal.value);
    session.connect();
  }
}

async function handleReset() {
  try {
    session.reset();
    await $fetch('/api/terminal', { method: 'DELETE' });
    session.connect();
  }
  catch {
    toast.add({
      id: 'terminal-reset-error',
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('terminal.resetTerminalError'),
    });
  }
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="computedTopic?.title"
        :description="computedTopic?.description"
      />

      <UPageBody>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <TasksCard :tasks="computedTopic?.tasks ?? []" class="lg:col-span-1" />
          <UPageCard class="lg:col-span-2" :ui="{ body: 'w-full' }">
            <template #title>
              <div class="flex justify-between items-center">
                {{ $t('topic.terminal') }}
                <div class="flex gap-1.5">
                  <UButton
                    v-if="session.canReconnect.value"
                    variant="ghost"
                    color="neutral"
                    size="lg"
                    @click="session.connect()"
                  >
                    {{ $t('topic.reconnect') }}
                  </UButton>
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="lg"
                    :loading="hasEverConnected && !canReset"
                    :disabled="!canReset"
                    @click="handleReset"
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
