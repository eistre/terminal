import type { Status } from '#shared/protocol';
import { decode, encode } from '#shared/protocol';

interface TerminalLike {
  write: (data: string) => void;
  writeln: (data: string) => void;
  onData: (callback: (data: string) => void) => void;
  onResize: (callback: (size: { cols: number; rows: number }) => void) => void;
  getSize: () => { cols: number; rows: number } | undefined;
}

function bannerInfo(message: string): string {
  return `\x1B[01;03;36m*** ${message} ***\x1B[0m\r\n`;
}

function bannerSuccess(message: string): string {
  return `\x1B[01;03;32m*** ${message} ***\x1B[0m\r\n`;
}

function bannerWarning(message: string): string {
  return `\x1B[01;03;33m*** ${message} ***\x1B[0m\r\n`;
}

function bannerError(message: string): string {
  return `\x1B[01;03;31m*** ${message} ***\x1B[0m\r\n`;
}

export function useTerminalSession(slug: string) {
  const terminal = ref<TerminalLike | undefined>(undefined);
  const size = ref<{ rows: number; cols: number } | undefined>(undefined);

  const url = computed(() => {
    const params = new URLSearchParams();
    params.set('slug', slug);

    if (size.value) {
      params.set('rows', String(size.value.rows));
      params.set('cols', String(size.value.cols));
    }

    return `/ws/terminal?${params.toString()}`;
  });

  const ws = useWebSocket<string>(url, {
    immediate: false,
    autoClose: true,
    autoReconnect: false,
    autoConnect: false,
    onMessage,
  });

  const socketStatus = ws.status;
  const sessionStatus = ref<Status>('IDLE');
  const lastTaskDoneId = ref<number | null>(null);

  const inputEnabled = computed(() => {
    return socketStatus.value === 'OPEN' && sessionStatus.value === 'READY';
  });

  const write = (data: string) => {
    if (terminal.value) {
      terminal.value.write(data);
    }
  };

  const attach = (instance: TerminalLike) => {
    terminal.value = instance;
    size.value = instance.getSize();

    instance.onData((data) => {
      if (inputEnabled.value) {
        ws.send(encode({ type: 'terminal/input', data }));
      }
    });

    instance.onResize((resize) => {
      size.value = resize;
      if (inputEnabled.value) {
        ws.send(encode({ type: 'terminal/resize', ...resize }));
      }
    });
  };

  const canReconnect = computed(() => {
    if (!terminal.value || !size.value) {
      return false;
    }

    if (socketStatus.value === 'OPEN' || socketStatus.value === 'CONNECTING') {
      return false;
    }

    return sessionStatus.value === 'ERROR' || sessionStatus.value === 'CLOSED';
  });

  const connect = () => {
    if (!terminal.value) {
      return;
    }

    if (socketStatus.value !== 'CLOSED') {
      return;
    }

    if (!size.value) {
      size.value = terminal.value.getSize();
    }

    ws.open();
  };

  const reset = () => {
    sessionStatus.value = 'RESETTING';
    if (socketStatus.value !== 'CLOSED') {
      ws.close();
    }
  };

  const resetTasks = () => {
    if (socketStatus.value === 'OPEN') {
      ws.send(encode({ type: 'tasks/reset' }));
    }
  };

  watch(socketStatus, (status, previousStatus) => {
    switch (status) {
      case 'CONNECTING': {
        write(bannerInfo('Connecting to terminal backend...'));
        break;
      }
      case 'OPEN': {
        write(bannerInfo('WebSocket connected to terminal backend'));
        break;
      }
      case 'CLOSED': {
        if (previousStatus === 'OPEN' || previousStatus === 'CONNECTING') {
          write(bannerWarning('Connection to terminal backend closed'));
        }
        break;
      }
    }
  }, { immediate: true });

  watch(sessionStatus, (status) => {
    switch (status) {
      case 'PROVISIONING': {
        write(bannerInfo('Provisioning linux container...'));
        break;
      }
      case 'CONNECTING': {
        write(bannerInfo('Container ready, creating terminal session connection...'));
        break;
      }
      case 'READY': {
        write(bannerSuccess('Terminal session established'));
        break;
      }
      case 'RESETTING': {
        write(bannerSuccess('Resetting terminal session...'));
        break;
      }
    }
  });

  function onMessage(_: unknown, event: MessageEvent<string | undefined>) {
    const raw = event.data;
    if (!raw) {
      return;
    }

    const msg = decode(raw);
    if (!msg) {
      console.warn('Invalid websocket message', raw);
      return;
    }

    switch (msg.type) {
      case 'terminal/output': {
        if (terminal.value) {
          terminal.value.write(msg.data);
        }
        break;
      }
      case 'terminal/status': {
        sessionStatus.value = msg.status;

        if (msg.status === 'ERROR') {
          const message = msg.message || 'An unexpected error occurred';
          write(bannerError(message));
        }
        else if (msg.status === 'CLOSED') {
          const message = msg.message || 'Terminal session closed';
          write(bannerWarning(message));
        }
        break;
      }
      case 'task/done': {
        lastTaskDoneId.value = msg.taskId;
        break;
      }
    }
  }

  return {
    attach,
    connect,
    reset,
    resetTasks,
    sessionStatus,
    canReconnect,
    lastTaskDoneId,
  };
}
