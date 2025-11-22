<script setup lang="ts">
import { en, et } from '@nuxt/ui/locale';

const { locale, setLocale } = useI18n();

function handleLocaleUpdate(value: string | undefined) {
  if (value === 'et' || value === 'en') {
    setLocale(value);
  }
}
</script>

<template>
  <UTooltip arrow :text="$t('header.changeLanguage')">
    <ULocaleSelect
      v-model="locale"
      :locales="[en, et]"
      class="w-32 text-md font-semibold text-white"
      variant="ghost"
      @update:model-value="handleLocaleUpdate"
    />
  </UTooltip>
</template>
