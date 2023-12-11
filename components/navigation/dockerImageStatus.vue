<script setup lang="ts">
const ready = useImageReady()
</script>

<template>
  <ClientOnly>
    <UTooltip
      :text="ready ? 'Kettapilt valmis' : 'Kettapilti ehitatakse'"
      :popper="{ arrow: true, placement: 'bottom' }"
    >
      <UButton
        icon="i-simple-icons-docker"
        :loading="!ready"
        variant="ghost"
        color="gray"
        class="text-white cursor-default disabled:cursor-default"
        size="xl"
      />
    </UTooltip>
  </ClientOnly>
</template>
