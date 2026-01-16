<script setup lang="ts">
const { t, locale, setLocale } = useI18n();

const flagIcon = computed(() => {
  return locale.value === 'en' ? 'i-flag-gb-4x3' : 'i-flag-ee-4x3';
});

const tooltipText = computed(() => {
  return locale.value === 'en' ? t('header.switchToEstonian') : t('header.switchToEnglish');
});

function toggleLocale() {
  setLocale(locale.value === 'en' ? 'et' : 'en');
}
</script>

<template>
  <ClientOnly>
    <UTooltip arrow :text="tooltipText">
      <UButton
        :icon="flagIcon"
        variant="ghost"
        @click="toggleLocale"
      />
    </UTooltip>
    <template #fallback>
      <USkeleton class="w-10 h-10 rounded-full bg-primary/75" />
    </template>
  </ClientOnly>
</template>
