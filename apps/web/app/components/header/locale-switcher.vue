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
  <UTooltip arrow :text="tooltipText">
    <UButton
      :icon="flagIcon"
      variant="ghost"
      @click="toggleLocale"
    />
  </UTooltip>
</template>
