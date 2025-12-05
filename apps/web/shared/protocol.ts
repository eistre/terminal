export type Status = 'IDLE' | 'PROVISIONING' | 'CONNECTING' | 'READY' | 'ERROR' | 'RESETTING' | 'CLOSING' | 'CLOSED';

export type ErrorCode = 'UNAUTHORIZED' | 'PROVISION_ERROR' | 'CONNECT_ERROR' | 'SESSION_ENDED' | 'INTERNAL_ERROR';

export type Message = {
  type: 'terminal/input';
  data: string;
} | {
  type: 'terminal/output';
  data: string;
} | {
  type: 'terminal/resize';
  rows: number;
  cols: number;
} | {
  type: 'terminal/status';
  status: Status;
} | {
  type: 'task/done';
  taskId: string;
};

export function encode(message: Message): string {
  return JSON.stringify(message);
}

export function decode(message: string): Message | null {
  try {
    return JSON.parse(message) as Message;
  }
  catch {
    return null;
  }
}
