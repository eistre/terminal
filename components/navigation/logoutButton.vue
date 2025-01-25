<script setup lang="ts">
const toast = useToast()
const i18n = useI18n()

const logout = async () => {
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })
  } catch (error) {
    toast.add({
      id: 'auth_logout_failed',
      icon: 'i-heroicons-x-mark',
      title: i18n.t('auth.logout_failed'),
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
    icon="i-heroicons-arrow-left-on-rectangle-solid"
    variant="ghost"
    color="gray"
    size="lg"
    :label="$t('auth.logout')"
    @click="logout"
  />
</template>
