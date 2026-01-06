<script setup lang="ts">
import type { DropdownMenuItem } from '#ui/components/DropdownMenu.vue';

const { t } = useI18n();
const session = authClient.useSession();
const toast = useToast();

const items: DropdownMenuItem[] = [
  {
    label: t('header.logout'),
    icon: 'i-lucide-log-out',
    onSelect: async () => {
      const { error: authError } = await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            navigateTo('/');
          },
        },
      });

      if (authError) {
        toast.add({
          id: 'logout-error',
          color: 'error',
          icon: 'i-lucide-alert-circle',
          title: t('header.logoutError'),
        });
      }
    },
  },
  {
    label: t('header.deleteAccount'),
    icon: 'i-lucide-trash',
    color: 'error',
    onSelect: async () => {
      const { error: authError } = await authClient.deleteUser({
        fetchOptions: {
          onSuccess: () => {
            navigateTo('/');
          },
        },
      });

      if (authError) {
        toast.add({
          id: 'delete-error',
          color: 'error',
          icon: 'i-lucide-alert-circle',
          title: t('header.deleteAccountError'),
        });
      }
    },
  },
];
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      trailing-icon="i-lucide-chevron-down"
      variant="ghost"
      color="neutral"
      class="font-semibold text-white"
      :label="session.data?.user.name"
    />
  </UDropdownMenu>
</template>
