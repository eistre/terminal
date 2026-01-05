<script setup lang="ts">
import type { Locale } from '#shared/locale';
import type { DraftTask, DraftTopic, EntitySelection } from './model';
import type { TaskLocaleMode } from './task-rules';
import { LOCALES } from '#shared/locale';

const props = defineProps<{
  selection: EntitySelection;
  activeLocale: Locale;
  taskLocaleMode: TaskLocaleMode;
}>();

const draft = defineModel<DraftTopic>({ required: true });

const { t } = useI18n();

function isTaskSelection(selection: EntitySelection) {
  return selection.kind === 'task';
}

const selectedTaskInfo = computed<{ index: number; task: DraftTask } | null>(() => {
  if (!isTaskSelection(props.selection)) {
    return null;
  }

  const clientId = props.selection.clientId;
  const index = draft.value.tasks.findIndex(t => t.clientId === clientId);
  const task = index >= 0 ? draft.value.tasks[index] : undefined;

  return task ? { index, task } : null;
});

const selectedTask = computed(() => selectedTaskInfo.value?.task ?? null);
const selectedTaskIndex = computed(() => selectedTaskInfo.value?.index ?? -1);

const isDualTaskLocale = computed(() => props.taskLocaleMode.kind === 'dual');

const activeTaskLocale = computed<Locale>(() => {
  return props.taskLocaleMode.kind === 'dual' ? props.activeLocale : props.taskLocaleMode.locale;
});

const taskLocalesForDisplay = computed<Locale[]>(() => {
  return props.taskLocaleMode.kind === 'dual' ? props.taskLocaleMode.locales : [activeTaskLocale.value];
});
</script>

<template>
  <div>
    <UPageCard :ui="{ body: 'w-full' }">
      <template #title>
        <div class="flex items-center justify-between py-1.5">
          <div class="font-semibold">
            {{ selection.kind === 'topic' ? t('topic.editor.panel.titleTopic') : t('topic.editor.panel.titleTask') }}
          </div>
        </div>
      </template>

      <USeparator />

      <div v-if="selection.kind === 'topic'" class="flex flex-col gap-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UCard v-for="locale in LOCALES" :key="locale">
            <template #header>
              <div class="font-semibold">
                {{ locale.toUpperCase() }}
              </div>
            </template>

            <div class="flex flex-col gap-4">
              <UFormField :label="t('topic.editor.panel.fieldTitle')" :name="`translations.${locale}.title`">
                <UInput v-model="draft.translations[locale].title" :ui="{ root: 'w-full' }" />
              </UFormField>

              <UFormField :label="t('topic.editor.panel.fieldDescription')" :name="`translations.${locale}.description`">
                <UTextarea v-model="draft.translations[locale].description" :ui="{ root: 'w-full' }" />
              </UFormField>
            </div>
          </UCard>
        </div>

        <TopicEditorSlugField
          v-model="draft.slug"
          v-model:edited="draft.slugEdited"
          :en-title="draft.translations.en.title"
          :et-title="draft.translations.et.title"
        />
      </div>

      <div v-else-if="selectedTask" class="flex flex-col gap-6">
        <div v-if="isDualTaskLocale" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UCard v-for="locale in taskLocalesForDisplay" :key="locale">
            <template #header>
              <div class="font-semibold">
                {{ locale.toUpperCase() }}
              </div>
            </template>

            <div class="flex flex-col gap-4">
              <UFormField :label="t('topic.editor.panel.fieldTitle')" :name="`tasks.${selectedTaskIndex}.translations.${locale}.title`">
                <UInput v-model="selectedTask.translations[locale].title" :ui="{ root: 'w-full' }" />
              </UFormField>

              <UFormField :label="t('topic.editor.panel.fieldContent')" :name="`tasks.${selectedTaskIndex}.translations.${locale}.content`">
                <UTextarea v-model="selectedTask.translations[locale].content" :ui="{ root: 'w-full' }" />
              </UFormField>

              <UFormField
                :label="t('topic.editor.panel.fieldHint')"
                :hint="t('topic.editor.panel.optional')"
                :name="`tasks.${selectedTaskIndex}.translations.${locale}.hint`"
              >
                <UTextarea v-model="selectedTask.translations[locale].hint" :ui="{ root: 'w-full' }" />
              </UFormField>
            </div>
          </UCard>
        </div>

        <div v-else>
          <UCard>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 w-1/2">
              <UFormField :label="t('topic.editor.panel.fieldTitle')" :name="`tasks.${selectedTaskIndex}.translations.${activeTaskLocale}.title`">
                <UInput v-model="selectedTask.translations[activeTaskLocale].title" :ui="{ root: 'w-full' }" />
              </UFormField>

              <UFormField :label="t('topic.editor.panel.fieldContent')" :name="`tasks.${selectedTaskIndex}.translations.${activeTaskLocale}.content`">
                <UTextarea v-model="selectedTask.translations[activeTaskLocale].content" :ui="{ root: 'w-full' }" />
              </UFormField>

              <UFormField
                :label="t('topic.editor.panel.fieldHint')"
                :hint="t('topic.editor.panel.optional')"
                :name="`tasks.${selectedTaskIndex}.translations.${activeTaskLocale}.hint`"
              >
                <UTextarea v-model="selectedTask.translations[activeTaskLocale].hint" :ui="{ root: 'w-full' }" />
              </UFormField>
            </div>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <div class="font-semibold">
              {{ t('topic.editor.panel.fieldRegex') }}
            </div>
          </template>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-18">
            <UFormField
              :label="t('topic.editor.panel.fieldRegex')"
              :name="`tasks.${selectedTaskIndex}.regex`"
            >
              <UInput v-model="selectedTask.regex" placeholder=".*" :ui="{ root: 'w-full' }" />
            </UFormField>

            <UFormField
              :label="t('topic.editor.panel.fieldWatchPath')"
              :help="t('topic.editor.panel.watchPathDescription')"
              :hint="t('topic.editor.panel.optional')"
              :name="`tasks.${selectedTaskIndex}.watchPath`"
            >
              <UInput
                v-model="selectedTask.watchPath"
                placeholder="/home/user"
                :ui="{ root: 'w-full' }"
              />
            </UFormField>
          </div>
        </UCard>
      </div>
    </UPageCard>
  </div>
</template>
