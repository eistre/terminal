<script setup lang="ts">
import type { FitAddon } from '@xterm/addon-fit';
import type { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

const terminalElement = ref<HTMLElement | null>(null);

let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;

const { height, width } = useElementSize(terminalElement);

onMounted(async () => {
  const { FitAddon } = await import('@xterm/addon-fit');
  const { Terminal } = await import('@xterm/xterm');

  terminal = new Terminal({ fontFamily: '"Cascadia Mono", Menlo, Monaco, "Courier New", monospace' });
  fitAddon = new FitAddon();

  if (!terminalElement.value) {
    return;
  }

  terminal.loadAddon(fitAddon);
  terminal.open(terminalElement.value);
  fitAddon.fit();
});

watch([height, width], () => {
  if (fitAddon && terminal) {
    fitAddon.fit();
  }
});

onUnmounted(() => {
  if (terminal) {
    terminal.dispose();
    terminal = null;
  }
  fitAddon = null;
});

defineExpose({
  write: (data: string) => terminal?.write(data),
  writeln: (data: string) => terminal?.writeln(data),
  clear: () => terminal?.clear(),
  reset: () => terminal?.reset(),
  focus: () => terminal?.focus(),
  onData: (callback: (data: string) => void) => terminal?.onData(callback),
  onResize: (callback: (data: { cols: number; rows: number }) => void) => terminal?.onResize(callback),
  getTerminal: () => terminal,
});
</script>

<template>
  <div ref="terminalElement" class="w-full h-full" />
</template>

<style scoped>
:deep(.xterm-viewport) {
  overflow: hidden !important;
}
</style>
