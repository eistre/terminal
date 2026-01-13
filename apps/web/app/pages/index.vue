<script setup lang="ts">
import type { Terminal } from '#components';
import type { ButtonProps } from '@nuxt/ui';

const session = authClient.useSession();
const { t } = useI18n();

const COLORS = {
  green: '\x1B[01;32m',
  blue: '\x1B[01;34m',
  reset: '\x1B[0m',
};

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

// Calculate total file size for single info.txt
const totalInfoSize = computed(() => {
  return t('home.demo.info1').length
    + t('home.demo.info2').length
    + t('home.demo.info3').length;
});

const demoSteps = computed<TypewriterStep[]>(() => {
  const steps: TypewriterStep[] = [];

  // 1. Connection sequence
  steps.push({ type: 'delay' });
  steps.push({
    type: 'instant-write',
    content: bannerInfo('Container ready, creating terminal session connection...'),
  });

  steps.push({ type: 'delay' });
  steps.push({
    type: 'instant-write',
    content: bannerSuccess('Terminal session established'),
  });

  steps.push({ type: 'delay', duration: 250 });

  // 2. Show the first prompt (instant)
  steps.push({
    type: 'instant-write',
    content: `${COLORS.green}user@terminal${COLORS.reset}:${COLORS.blue}~${COLORS.reset}$ `,
  });
  steps.push({ type: 'delay', duration: 750 });

  // 3. Type `ls -la` command (with typewriter effect)
  steps.push({ type: 'write', content: 'ls -la' });
  steps.push({ type: 'delay', duration: 250 });
  steps.push({ type: 'instant-writeln' });
  steps.push({ type: 'delay', duration: 250 });

  // 4. Show `ls -la` output (instant)
  steps.push({ type: 'instant-writeln', content: 'total 32' });
  steps.push({
    type: 'instant-writeln',
    content: `drwxr-x--- 3 user user 4096 Jan  8 10:30 ${COLORS.blue}.${COLORS.reset}`,
  });
  steps.push({
    type: 'instant-writeln',
    content: `drwxr-xr-x 3 root root 4096 Jan  8 10:00 ${COLORS.blue}..${COLORS.reset}`,
  });
  steps.push({
    type: 'instant-writeln',
    content: `-rw-r--r-- 1 user user  220 Jan  8 10:00 .bashrc`,
  });
  steps.push({
    type: 'instant-writeln',
    content: `-rw-r--r-- 1 user user  807 Jan  8 10:00 .profile`,
  });
  steps.push({
    type: 'instant-writeln',
    content: `drwx------ 2 user user 4096 Jan  8 10:00 ${COLORS.blue}.ssh${COLORS.reset}`,
  });
  steps.push({
    type: 'instant-writeln',
    content: `-rw-r--r-- 1 user user ${String(totalInfoSize.value + 4).padStart(4)} Jan  8 10:30 info.txt`,
  });
  steps.push({ type: 'delay' });

  // 5. Show prompt
  steps.push({
    type: 'instant-write',
    content: `${COLORS.green}user@terminal${COLORS.reset}:${COLORS.blue}~${COLORS.reset}$ `,
  });
  steps.push({ type: 'delay' });

  // 6. Type `cat info.txt` command
  steps.push({ type: 'write', content: 'cat info.txt' });
  steps.push({ type: 'delay', duration: 250 });
  steps.push({ type: 'instant-writeln' });
  steps.push({ type: 'delay', duration: 250 });

  // 7. Show all info content instantly (with blank lines between sections)
  steps.push({ type: 'instant-writeln', content: t('home.demo.info1') });
  steps.push({ type: 'instant-writeln' });
  steps.push({ type: 'instant-writeln', content: t('home.demo.info2') });
  steps.push({ type: 'instant-writeln' });
  steps.push({ type: 'instant-writeln', content: t('home.demo.info3') });
  steps.push({ type: 'delay' });

  // 8. Final prompt (idle)
  steps.push({
    type: 'instant-write',
    content: `${COLORS.green}user@terminal${COLORS.reset}:${COLORS.blue}~${COLORS.reset}$ `,
  });

  return steps;
});

const { attach, start, reset } = useTypewriter(demoSteps);
const terminal = ref<InstanceType<typeof Terminal>>();

watch(demoSteps, () => {
  reset();
  nextTick(() => start());
});

function bannerInfo(message: string): string {
  return `\x1B[03;36m*** ${message} ***\x1B[0m\r\n`;
}

function bannerSuccess(message: string): string {
  return `\x1B[03;32m*** ${message} ***\x1B[0m\r\n`;
}

function handleTerminalReady() {
  if (terminal.value) {
    attach(terminal.value);
    start();
  }
}
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
        <Terminal ref="terminal" @ready="handleTerminalReady" />
      </div>
    </UPageHero>
  </UPage>
</template>
