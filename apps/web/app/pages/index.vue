<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui';

const session = authClient.useSession();

const { t } = useI18n();

const links: ComputedRef<ButtonProps[]> = computed(() => {
  const items: ButtonProps[] = [{
    label: t('home.getStarted'),
    to: '/topics',
    size: 'xl',
  }];

  if (!session.value.data) {
    items.push({
      label: t('home.signIn'),
      to: '/auth',
      color: 'neutral',
      variant: 'outline',
      size: 'xl',
    });
  }

  return items;
});
</script>

<template>
  <UPage>
    <UPageHero
      orientation="horizontal"
      :headline="$t('home.secondary')"
      :title="$t('home.title')"
      description="Aute cupidatat deserunt voluptate esse et sunt velit esse quis excepteur fugiat amet id.  Non Lorem nisi voluptate commodo ea. Labore exercitation ipsum ea exercitation excepteur eu."
      :links="links"
      :ui="{
        title: 'text-3xl sm:text-4xl',
        container: 'lg:grid-cols-5 py-10 lg:py-10 md:py-10 sm:py-10',
        wrapper: 'lg:col-span-2',
      }"
    >
      <div class="lg:col-span-3 h-[500px] lg:h-[calc(100vh-36rem)] lg:min-h-[500px] w-full bg-neutral-600 dark:bg-black rounded-lg flex items-center justify-center text-neutral-400">
        PLACEHOLDER FOR XTERM TERMINAL
      </div>
    </UPageHero>
  </UPage>
</template>
