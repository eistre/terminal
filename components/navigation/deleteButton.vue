<script setup lang="ts">
const toast = useToast()
const i18n = useI18n()

const deleteUser = async () => {
  try {
    await $fetch('/api/auth/delete', {
      method: 'POST'
    })

    toast.add({
      id: 'auth_delete_success',
      icon: 'i-heroicons-check',
      title: i18n.t('auth.delete_success'),
      timeout: 5000,
      color: 'green'
    })
  } catch (error) {
    toast.add({
      id: 'auth_delete_failed',
      icon: 'i-heroicons-x-mark',
      title: i18n.t('auth.delete_error'),
      timeout: 5000,
      color: 'red'
    })
    return
  }

  await fetchUser()
  await navigateTo('/')
}
</script>

<template>
  <UButton
    icon="i-heroicons-trash-solid"
    variant="ghost"
    color="gray"
    size="lg"
    :label="$t('auth.delete_user')"
    @click="deleteUser"
  />
</template>
