<script setup lang="ts">
const toast = useToast()

const deleteUser = async () => {
  const { error } = await useFetch('/api/auth/delete', {
    method: 'POST',
    onResponse: ({ response }) => {
      if (response.status === 204) {
        toast.add({
          id: 'auth_delete_success',
          icon: 'i-heroicons-check',
          title: 'Account deleted successfully',
          timeout: 5000,
          color: 'green'
        })
      }
    }
  })

  if (error.value) {
    toast.add({
      id: 'auth_delete_failed',
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
