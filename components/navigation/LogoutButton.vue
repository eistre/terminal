<script setup lang="ts">
const logout = async () => {
  const { error } = await useFetch('/api/auth/logout', {
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
    text="Logi välja"
    :popper="{ arrow: true, placement: 'bottom' }"
  >
    <UButton
      icon="i-heroicons-arrow-left-on-rectangle-solid"
      variant="ghost"
      color="gray"
      class="text-white"
      size="xl"
      @click="logout"
    />
  </UTooltip>
</template>
