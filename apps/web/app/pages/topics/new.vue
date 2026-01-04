<script setup lang="ts">
import type { Form } from '#ui/types';
import type { DraftTopic, EntitySelection } from '~/components/topic/editor/model';
import { validateDraft } from '~/components/topic/editor/form-validation';
import { createEmptyTask, createEmptyTopic } from '~/components/topic/editor/model';
import { toUpsertPayload } from '~/components/topic/editor/payload';
import { getTaskLocaleModeFromTopicTitle } from '~/components/topic/editor/task-rules';

const { t, locale } = useI18n();
const toast = useToast();

const draft = reactive<DraftTopic>(createEmptyTopic());

let nextClientId = -1;

draft.tasks.push(createEmptyTask(nextClientId));
nextClientId -= 1;

const selection = ref<EntitySelection>({ kind: 'topic' });
const saving = ref(false);

const form = useTemplateRef<Form<DraftTopic>>('form');

const localeMode = computed(() => getTaskLocaleModeFromTopicTitle(draft, locale.value));

const isSaveReady = computed(() => validateDraft(draft).length === 0);

function setSelection(next: EntitySelection) {
  selection.value = next;
}

function addTask() {
  const clientId = nextClientId;
  nextClientId -= 1;

  draft.tasks.push(createEmptyTask(clientId));
  selection.value = { kind: 'task', clientId };
}

function applyReorder(clientIds: number[]) {
  const tasksById = new Map(draft.tasks.map(t => [t.clientId, t]));
  const reordered: DraftTopic['tasks'] = [];

  for (const clientId of clientIds) {
    const task = tasksById.get(clientId);
    if (task) {
      reordered.push(task);
      tasksById.delete(clientId);
    }
  }

  for (const task of draft.tasks) {
    if (tasksById.has(task.clientId)) {
      reordered.push(task);
    }
  }

  draft.tasks.splice(0, draft.tasks.length, ...reordered);
}

function removeTask(clientId: number) {
  if (draft.tasks.length <= 1) {
    return;
  }

  const index = draft.tasks.findIndex(task => task.clientId === clientId);
  if (index < 0) {
    return;
  }

  draft.tasks.splice(index, 1);

  if (selection.value.kind !== 'task' || selection.value.clientId !== clientId) {
    return;
  }

  const nextTask = draft.tasks[index] ?? draft.tasks[index - 1];
  selection.value = nextTask
    ? { kind: 'task', clientId: nextTask.clientId }
    : { kind: 'topic' };
}

async function save() {
  await form.value?.validate();
  if (!isSaveReady.value) {
    return;
  }

  try {
    saving.value = true;

    await $fetch('/api/admin/topics', {
      method: 'POST',
      body: toUpsertPayload(draft),
    });

    toast.add({
      id: 'topic-create-success',
      color: 'success',
      icon: 'i-lucide-check-circle',
      title: t('topic.editor.saveSuccess'),
    });

    navigateTo('/topics');
  }
  catch {
    toast.add({
      id: 'topic-create-error',
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('topic.editor.saveError'),
    });
  }
  finally {
    saving.value = false;
  }
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="$t('topics.new')">
        <template #links>
          <div class="flex items-center gap-2">
            <UBadge
              variant="subtle"
              :color="isSaveReady ? 'success' : 'warning'"
            >
              {{ isSaveReady ? $t('topic.editor.readyToSave') : $t('topic.editor.missingItems') }}
            </UBadge>

            <UButton
              type="button"
              color="primary"
              icon="i-lucide-save"
              variant="subtle"
              :loading="saving"
              :disabled="saving || !isSaveReady"
              @click="save"
            >
              {{ $t('topic.editor.create') }}
            </UButton>
          </div>
        </template>
      </UPageHeader>

      <UPageBody>
        <UForm ref="form" :validate="validateDraft" :state="draft">
          <div v-if="form?.getErrors('form').length" class="mb-6">
            <UAlert
              color="error"
              icon="i-lucide-alert-circle"
              :title="t('topic.editor.validationError')"
              :description="form.getErrors('form')[0]?.message"
            />
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <TopicEditorSidebar
              class="lg:col-span-1"
              :tasks="draft.tasks"
              :selection="selection"
              :active-locale="localeMode.kind === 'dual' ? locale : localeMode.locale"
              :task-locale-mode="localeMode"
              @select="setSelection"
              @add-task="addTask"
              @reorder="applyReorder"
              @remove-task="removeTask"
            />

            <TopicEditorPanel
              v-model="draft"
              class="lg:col-span-2"
              :selection="selection"
              :active-locale="locale"
              :task-locale-mode="localeMode"
            />
          </div>
        </UForm>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
