<script setup lang="ts">
import type { FitAddon } from '@xterm/addon-fit';
import type { WebglAddon } from '@xterm/addon-webgl';
import type { ITerminalOptions, Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

const emit = defineEmits<{ (e: 'ready'): void }>();

const terminalElement = ref<HTMLElement | null>(null);

const terminal = ref<Terminal | null>(null);
const fitAddon = ref<FitAddon | null>(null);
const webglAddon = ref<WebglAddon | null>(null);

const terminalOptions: ITerminalOptions = {
  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Mono", Menlo, Monaco, "Courier New", monospace',
  fontSize: 14,
  lineHeight: 1.2,
  letterSpacing: 0,
  cursorStyle: 'block',
  cursorBlink: true,
  scrollback: 5000,
};

const { height, width } = useElementSize(terminalElement);

watch([height, width], () => {
  if (fitAddon.value && terminal.value) {
    fitAddon.value.fit();
  }
});

onMounted(async () => {
  const { Terminal } = await import('@xterm/xterm');
  const { FitAddon } = await import('@xterm/addon-fit');
  const { WebglAddon } = await import('@xterm/addon-webgl');

  if (!terminalElement.value) {
    return;
  }

  terminal.value = new Terminal(terminalOptions);
  fitAddon.value = new FitAddon();
  webglAddon.value = new WebglAddon();

  terminal.value.loadAddon(fitAddon.value);
  terminal.value.loadAddon(webglAddon.value);
  terminal.value.open(terminalElement.value);
  fitAddon.value.fit();

  emit('ready');
});

onBeforeUnmount(() => {
  terminal.value = null;
  fitAddon.value = null;
  webglAddon.value = null;
});

defineExpose({
  write: (data: string) => terminal.value?.write(data),
  writeln: (data: string) => terminal.value?.writeln(data),
  onData: (callback: (data: string) => void) => terminal.value?.onData(callback),
  onResize: (callback: (data: { cols: number; rows: number }) => void) => terminal.value?.onResize(callback),
  getSize: () => fitAddon.value?.proposeDimensions(),
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
