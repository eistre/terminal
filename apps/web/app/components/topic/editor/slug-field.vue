<script setup lang="ts">
import { getAutoSlug } from './model';

const props = defineProps<{
  enTitle: string;
  etTitle: string;
}>();

const slug = defineModel<string>({ required: true });
const edited = defineModel<boolean>('edited', { required: true });

const { t } = useI18n();

const computedSlug = computed(() => {
  return getAutoSlug(props.enTitle, props.etTitle);
});

watch(computedSlug, (value) => {
  if (!edited.value) {
    slug.value = value;
  }
});

function resetToAuto() {
  edited.value = false;
  slug.value = computedSlug.value;
}

function onInput(value: string | null | undefined) {
  edited.value = true;
  slug.value = value ?? '';
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="font-semibold">
          {{ t('topic.editor.slug.title') }}
        </div>

        <UButton
          v-if="edited"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="resetToAuto"
        >
          {{ t('topic.editor.slug.resetToTitle') }}
        </UButton>
      </div>
    </template>

    <div class="flex flex-col gap-2 w-1/2">
      <UFormField :label="t('topic.editor.slug.canonicalLabel')" name="slug">
        <UInput :model-value="slug" :ui="{ root: 'w-full' }" @update:model-value="onInput" />
      </UFormField>

      <div v-if="slug.trim().length > 0" class="text-xs text-neutral-500">
        {{ t('topic.editor.slug.publicUrlLabel') }}:
        <span class="font-mono">/topics/{{ slug }}</span>
      </div>
    </div>
  </UCard>
</template>
