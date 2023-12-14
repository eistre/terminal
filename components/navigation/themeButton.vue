// https://ui.nuxt.com/getting-started/examples
<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed({
  get () {
    return colorMode.value === 'dark'
  },
  set () {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})
</script>

<template>
  <ClientOnly>
    <UTooltip
      :text="isDark ? $t('bar.light') : $t('bar.dark')"
      :popper="{ arrow: true, placement: 'bottom' }"
    >
      <UButton
        :icon="isDark ? 'i-heroicons-moon-solid' : 'i-heroicons-sun-solid'"
        variant="ghost"
        color="gray"
        class="text-white"
        size="xl"
        @click="isDark = !isDark"
      />
    </UTooltip>
  </ClientOnly>
</template>
