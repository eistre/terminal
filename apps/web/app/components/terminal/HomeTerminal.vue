<script setup lang="ts">
import XtermTerminal from '~/components/terminal/XtermTerminal.vue';

const { t } = useI18n();
const terminal = ref<InstanceType<typeof XtermTerminal>>();

const COLORS = {
  green: '\x1B[01;32m',
  blue: '\x1B[01;34m',
  reset: '\x1B[0m',
};

function bannerInfo(message: string): string {
  return `\x1B[01;03;36m*** ${message} ***\x1B[0m\r\n`;
}

function bannerSuccess(message: string): string {
  return `\x1B[01;03;32m*** ${message} ***\x1B[0m\r\n`;
}

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
    content: `-rw-r--r-- 1 user user ${String(totalInfoSize.value + 5).padStart(4)} Jan  8 10:30 info.txt`,
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

watch(demoSteps, () => {
  reset();
  nextTick(() => start());
});

function handleTerminalReady() {
  if (terminal.value) {
    attach(terminal.value);
    start();
  }
}
</script>

<template>
  <XtermTerminal ref="terminal" @ready="handleTerminalReady" />
</template>
