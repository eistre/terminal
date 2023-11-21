<script setup lang="ts">
const deleteUser = async () => {
  const { error } = await useFetch('/api/auth/delete', {
    method: 'POST'
  })

  if (error.value) {
    // TODO
    return
  }

  await navigateTo('/')
}
</script>

<template>
  <UTooltip
    text="Kustuta kasutaja"
    :popper="{ arrow: true, placement: 'bottom' }"
  >
    <UButton
      icon="i-heroicons-trash-solid"
      variant="ghost"
      color="gray"
      class="text-white"
      size="xl"
      @click="deleteUser"
    />
  </UTooltip>
</template>
