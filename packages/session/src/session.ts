import type { Buffer } from 'node:buffer';
import type { Client, ClientChannel } from 'ssh2';

export interface Session {
  write: (data: string) => void;
  onData: (callback: (data: string) => void) => void;
  resize: (rows: number, cols: number) => void;
  close: () => void;
  onClose: (callback: () => void) => void;
}

export class SessionImpl implements Session {
  private readonly client: Client;
  private readonly channel: ClientChannel;
  private closed = false;

  constructor(client: Client, channel: ClientChannel) {
    this.client = client;
    this.channel = channel;
  }

  write(data: string) {
    this.channel.write(data);
  }

  onData(callback: (data: string) => void) {
    this.channel.on('data', (data: Buffer) => {
      callback(data.toString('utf-8'));
    });

    this.channel.stderr.on('data', (data: Buffer) => {
      callback(data.toString('utf-8'));
    });
  }

  resize(rows: number, cols: number): void {
    this.channel.setWindow(rows, cols, 0, 0);
  }

  close() {
    if (!this.closed) {
      this.closed = true;
      this.channel.close();
      this.client.end();
    }
  }

  onClose(callback: () => void) {
    this.channel.on('close', callback);
  }
}
