<script setup lang="ts">
const toast = useToast()
const i18n = useI18n()

const logout = async () => {
  const { error } = await useFetch('/api/auth/logout', {
    method: 'POST'
  })

  if (error.value) {
    toast.add({
      id: 'auth_logout_failed',
      icon: 'i-heroicons-x-mark',
      title: i18n.t('auth.logout_failed'),
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
    :text="$t('auth.logout')"
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
