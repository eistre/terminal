<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui';
import HomeTerminal from '~/components/terminal/HomeTerminal.vue';

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
      :description="$t('home.description')"
      :links="links"
      :ui="{
        title: 'text-3xl sm:text-4xl',
        container: 'lg:grid-cols-5 py-10 lg:py-10 md:py-10 sm:py-10',
        wrapper: 'lg:col-span-2',
      }"
    >
      <div class="lg:col-span-3 bg-black rounded-lg p-4 terminal-height">
        <HomeTerminal />
      </div>
    </UPageHero>
  </UPage>
</template>
