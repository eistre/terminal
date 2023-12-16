<script setup lang="ts">
const user = useAuthenticatedUser()
</script>

<template>
  <UPopover mode="hover">
    <UButton
      trailing-icon="i-heroicons-chevron-down-20-solid"
      variant="ghost"
      color="gray"
      class="text-white"
      size="lg"
      :label="user.name"
    />

    <template #panel>
      <div class="flex flex-col p-1">
        <NavigationLogoutButton />
        <NavigationDeleteButton />
      </div>
    </template>
  </UPopover>
</template>
