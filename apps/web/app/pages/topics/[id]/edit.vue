<script setup lang="ts">
import type { Form } from '#ui/types';
import type { DraftTopic, EntitySelection } from '~/components/topic/editor/model';
import { validateDraft } from '~/components/topic/editor/form-validation';
import { createEmptyTask, createEmptyTopic, editableTopicToDraft } from '~/components/topic/editor/model';
import { toUpsertPayload } from '~/components/topic/editor/payload';
import { getTaskLocaleModeFromTopicTitle } from '~/components/topic/editor/task-rules';

const { t, locale } = useI18n();
const toast = useToast();
const route = useRoute();
const id = Number(route.params.id);

const { data: topic, status, error } = await useFetch(`/api/admin/topics/${id}`, { method: 'GET', deep: true });

watch(status, (newStatus) => {
  if (newStatus === 'error' && error.value) {
    toast.add({
      id: 'edit-topic-error',
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('topic.editor.loadError'),
    });

    navigateTo('/topics');
  }
}, { immediate: true });

const draft = reactive<DraftTopic>(createEmptyTopic(id));

watch(topic, (value) => {
  if (value) {
    Object.assign(draft, editableTopicToDraft(value));
  }
}, { immediate: true });

let nextClientId = -1;

const selection = ref<EntitySelection>({ kind: 'topic' });
const saving = ref(false);
const localeDeletionConfirmOpen = ref(false);

const form = useTemplateRef<Form<DraftTopic>>('form');

const localeMode = computed(() => getTaskLocaleModeFromTopicTitle(draft, locale.value));

const isSaveReady = computed(() => validateDraft(draft).length === 0);

const pageTitle = computed(() => {
  const preferred = locale.value;
  const other = preferred === 'en' ? 'et' : 'en';
  return draft.translations[preferred].title.trim()
    || draft.translations[other].title.trim()
    || draft.slug.trim()
    || `Topic ${draft.id}`;
});

const localeDeletion = computed(() => {
  const persisted = topic.value?.translations.map(t => t.locale) ?? [];

  const willSave = [];
  if (draft.translations.en.title.trim().length > 0) {
    willSave.push('en');
  }
  if (draft.translations.et.title.trim().length > 0) {
    willSave.push('et');
  }

  const willSaveSet = new Set(willSave);
  const deleted = persisted.filter(locale => !willSaveSet.has(locale));

  return {
    deleted,
    label: deleted.map(l => l.toUpperCase()).join(' + '),
    needsConfirm: deleted.length > 0,
  };
});

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

async function save(skipLocaleDeletionConfirm: boolean) {
  await form.value?.validate();
  if (!isSaveReady.value) {
    return;
  }

  if (!skipLocaleDeletionConfirm && localeDeletion.value.needsConfirm) {
    localeDeletionConfirmOpen.value = true;
    return;
  }
  else {
    localeDeletionConfirmOpen.value = false;
  }

  try {
    saving.value = true;

    await $fetch(`/api/admin/topics/${draft.id}`, {
      method: 'PUT',
      body: toUpsertPayload(draft),
    });

    toast.add({
      id: `topic-save-success-${id}`,
      color: 'success',
      icon: 'i-lucide-check-circle',
      title: t('topic.editor.saveSuccess'),
    });

    navigateTo('/topics');
  }
  // TODO should probably think about slug conflict
  catch {
    toast.add({
      id: 'topic-save-error',
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
      <UPageHeader :title="pageTitle">
        <template #links>
          <div class="flex items-center gap-2">
            <UBadge
              variant="subtle"
              :color="isSaveReady ? 'success' : 'warning'"
            >
              {{ isSaveReady ? $t('topic.editor.readyToSave') : $t('topic.editor.missingItems') }}
            </UBadge>

            <UPopover v-model:open="localeDeletionConfirmOpen" arrow>
              <UButton
                type="button"
                color="primary"
                icon="i-lucide-save"
                variant="subtle"
                :loading="saving"
                :disabled="saving || !isSaveReady"
                @click="save(false)"
              >
                {{ $t('topic.editor.saveChanges') }}
              </UButton>

              <template #content="{ close }">
                <UCard :ui="{ body: 'flex flex-col gap-4' }">
                  <div class="font-semibold">
                    {{ $t('topic.editor.confirmLocaleDeletionTitle', { locale: localeDeletion.label }) }}
                  </div>

                  <div class="text-sm text-neutral-600 dark:text-neutral-300">
                    {{ $t('topic.editor.confirmLocaleDeletionMessage', { locale: localeDeletion.label }) }}
                  </div>

                  <div class="flex justify-end gap-2">
                    <UButton
                      variant="ghost"
                      color="neutral"
                      @click="close"
                    >
                      {{ $t('topic.editor.cancel') }}
                    </UButton>
                    <UButton
                      variant="solid"
                      color="error"
                      @click="save(true)"
                    >
                      {{ $t('topic.editor.confirm') }}
                    </UButton>
                  </div>
                </UCard>
              </template>
            </UPopover>
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
