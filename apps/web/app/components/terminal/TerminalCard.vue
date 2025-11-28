<script setup lang="ts">
import XtermTerminal from './XtermTerminal.vue';

const terminal = ref<InstanceType<typeof XtermTerminal>>();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function test() {
  if (!terminal.value)
    return;

  const term = terminal.value;

  await delay(500);

  term.writeln('\x1B[1;36m╔══════════════════════════════════════════╗\x1B[0m');
  term.writeln('\x1B[1;36m║        Terminal Component Ready          ║\x1B[0m');
  term.writeln('\x1B[1;36m╚══════════════════════════════════════════╝\x1B[0m');
  term.writeln('');
  term.writeln('Terminal is working! WebSocket integration coming soon...');
  term.writeln('');
  term.write('\x1B[32m$\x1B[0m ');
}

onMounted(() => {
  test();
});
</script>

<template>
  <UPageCard :title="$t('topic.terminal')">
    <USeparator />

    <div class="bg-black rounded-lg terminal-height p-4">
      <XtermTerminal ref="terminal" />
    </div>
  </UPageCard>
</template>
