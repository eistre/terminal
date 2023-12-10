<script setup lang="ts">
const toast = useToast()

const logout = async () => {
  const { error } = await useFetch('/api/auth/logout', {
    method: 'POST'
  })

  if (error.value) {
    toast.add({
      id: 'auth_logout_failed',
      icon: 'i-heroicons-x-mark',
      title: error.value.statusMessage,
      description: error.value.data.message,
      timeout: 5000,
      color: 'red'
    })
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
