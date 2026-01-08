export type TypewriterStep = {
  type: 'write' | 'writeln' | 'instant-write' | 'instant-writeln';
  content?: string;
} | {
  type: 'delay';
  duration?: number;
};

interface TerminalLike {
  write: (data: string) => void;
  reset: () => void;
}

const DEFAULT_CHAR_DELAY_MS = 80;
const DEFAULT_STEP_DELAY_MS = 500;

export function useTypewriter(steps: ComputedRef<TypewriterStep[]> | Ref<TypewriterStep[]>) {
  const terminal = ref<TerminalLike | undefined>(undefined);
  const abortController = ref<AbortController | undefined>(undefined);
  const hasStarted = ref(false);

  const sleep = async (ms: number = DEFAULT_CHAR_DELAY_MS) => {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);

      abortController.value?.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Aborted'));
      }, { once: true });
    });
  };

  const write = async (data: string) => {
    if (!terminal.value) {
      return;
    }

    for (const char of data) {
      if (abortController.value?.signal.aborted) {
        return;
      }

      terminal.value.write(char);
      await sleep();
    }
  };

  const attach = (instance: TerminalLike) => {
    terminal.value = instance;
  };

  const executeStep = async (step: TypewriterStep) => {
    if (!terminal.value || abortController.value?.signal.aborted) {
      return;
    }

    switch (step.type) {
      case 'write':
        if (step.content) {
          await write(step.content);
        }
        break;

      case 'writeln':
        if (step.content) {
          await write(step.content);
        }
        terminal.value.write('\r\n');
        break;

      case 'instant-write':
        if (step.content) {
          terminal.value.write(step.content);
        }
        break;

      case 'instant-writeln':
        if (step.content) {
          terminal.value.write(step.content);
        }
        terminal.value.write('\r\n');
        break;

      case 'delay':
        await sleep(step.duration ?? DEFAULT_STEP_DELAY_MS);
        break;
    }
  };

  const start = async () => {
    if (hasStarted.value || !terminal.value) {
      return;
    }

    abortController.value?.abort();
    abortController.value = new AbortController();
    hasStarted.value = true;

    try {
      for (const step of steps.value) {
        if (abortController.value?.signal.aborted) {
          break;
        }

        await executeStep(step);
      }
    }
    catch (error) {
      if (error instanceof Error && error.message !== 'Aborted') {
        console.error('Typewriter error:', error);
      }
    }
    finally {
      hasStarted.value = false;
    }
  };

  const stop = () => {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = undefined;
    }
    hasStarted.value = false;
  };

  const reset = () => {
    stop();
    terminal.value?.reset();
  };

  onUnmounted(stop);

  return {
    attach,
    start,
    reset,
  };
}
