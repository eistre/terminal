<script setup lang="ts">
const { id } = defineProps<{ id: number }>()
</script>

<template>
  <UTooltip
    :text="$t('exercises.edit_text')"
    :popper="{ arrow: true, placement: 'bottom' }"
  >
    <UButton
      icon="i-heroicons-pencil-solid"
      variant="ghost"
      color="primary"
      size="xl"
      @click="navigateTo(`/exercises/edit/${id}`)"
    />
  </UTooltip>
</template>
