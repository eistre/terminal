<script setup lang="ts">
import type { DropdownMenuItem } from '#ui/components/DropdownMenu.vue';

const { t } = useI18n();
const session = authClient.useSession();
const toast = useToast();
const config = useConfig();

const items: ComputedRef<DropdownMenuItem[]> = computed(() => {
  const items: DropdownMenuItem[] = [];

  if (session.value.data?.user.role === 'admin') {
    items.push({
      label: t('header.emailDomains'),
      icon: 'i-lucide-mail',
      onSelect: () => {
        navigateTo('/email-domains');
      },
    });
  }

  items.push({
    label: t('header.logout'),
    icon: 'i-lucide-log-out',
    onSelect: async () => {
      const { error } = await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            navigateTo('/');
          },
        },
      });

      if (error) {
        toast.add({
          color: 'error',
          icon: 'i-lucide-alert-circle',
          title: t('header.logoutError'),
        });
      }
    },
  });

  if (session.value.data?.user.email !== config.value.adminEmail) {
    items.push({
      label: t('header.deleteAccount'),
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: async () => {
        const { error } = await authClient.deleteUser({
          fetchOptions: {
            onSuccess: () => {
              navigateTo('/');
            },
          },
        });

        if (error) {
          toast.add({
            color: 'error',
            icon: 'i-lucide-alert-circle',
            title: t('header.deleteAccountError'),
          });
        }
      },
    });
  }

  return items;
});
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      trailing-icon="i-lucide-chevron-down"
      variant="ghost"
      color="neutral"
      size="xl"
      class="font-semibold text-white"
    >
      <span class="hidden md:inline">{{ session.data?.user.name }}</span>
      <UIcon name="i-lucide-circle-user" class="md:hidden" size="20" />
    </UButton>
  </UDropdownMenu>
</template>
