<script setup lang="ts">
import * as locales from '@nuxt/ui/locale';

const colorMode = useColorMode();
const { locale } = useI18n();

const isDark = computed({
  get() {
    return colorMode.value === 'dark';
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light';
  },
});

const activeLocale = computed(() => locales[locale.value]);
const tooltip = computed(() => {
  if (isDark.value) {
    return activeLocale.value.messages.colorMode.switchToLight;
  }
  else {
    return activeLocale.value.messages.colorMode.switchToDark;
  }
});
</script>

<template>
  <ClientOnly v-if="!colorMode.forced">
    <UTooltip arrow :text="tooltip">
      <UButton
        :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
        variant="ghost"
        class="text-white"
        size="xl"
        @click="isDark = !isDark"
      />
    </UTooltip>
    <template #fallback>
      <USkeleton class="w-10 h-10 rounded-full bg-primary/75" />
    </template>
  </ClientOnly>
</template>
