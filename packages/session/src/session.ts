import type { Buffer } from 'node:buffer';
import type { Client, ClientChannel } from 'ssh2';
import { EventEmitter } from 'node:events';

export interface Session {
  write: (data: string) => void;
  onData: (callback: (data: string) => void) => void;
  onExecData: (callback: (data: string) => void) => void;
  resize: (rows: number, cols: number) => void;
  close: () => void;
  onClose: (callback: () => void) => void;
  onError: (callback: (error: unknown) => void) => void;
}

export class SessionImpl extends EventEmitter implements Session {
  private readonly client: Client;
  private readonly shellChannel: ClientChannel;
  private readonly execChannel: ClientChannel | null;

  private closing = false;
  private error = false;

  constructor(client: Client, shellChannel: ClientChannel, execChannel: ClientChannel | null) {
    super();

    this.client = client;
    this.shellChannel = shellChannel;
    this.execChannel = execChannel;

    // Avoids terminating if we don't register an onError callback
    this.on('error', () => undefined);

    this.client.on('error', (error: unknown) => {
      this.fail(error);
    });

    this.shellChannel.on('error', (error: unknown) => {
      this.fail(error);
    });

    this.execChannel?.on('error', (error: unknown) => {
      this.fail(error);
    });

    this.client.on('close', () => {
      this.close();
    });

    this.shellChannel.on('close', () => {
      this.close();
    });

    this.execChannel?.on('close', () => {
      if (!this.closing && !this.error) {
        this.fail(new Error('Exec channel closed unexpectedly'));
        return;
      }

      this.close();
    });
  }

  write(data: string) {
    this.shellChannel.write(data);
  }

  onData(callback: (data: string) => void) {
    this.shellChannel.on('data', (data: Buffer) => {
      callback(data.toString('utf-8'));
    });

    this.shellChannel.stderr.on('data', (data: Buffer) => {
      callback(data.toString('utf-8'));
    });
  }

  onExecData(callback: (data: string) => void) {
    this.execChannel?.on('data', (data: Buffer) => {
      callback(data.toString('utf-8'));
    });

    this.execChannel?.stderr.on('data', (data: Buffer) => {
      callback(data.toString('utf-8'));
    });
  }

  resize(rows: number, cols: number): void {
    this.shellChannel.setWindow(rows, cols, 0, 0);
  }

  close() {
    if (!this.closing) {
      this.closing = true;
      this.shellChannel.close();
      this.execChannel?.close();
      this.client.end();
      this.emit('close');
    }
  }

  onClose(callback: () => void) {
    this.once('close', callback);
  }

  onError(callback: (error: unknown) => void) {
    this.once('error', callback);
  }

  private fail(error: unknown) {
    if (!this.error) {
      this.error = true;
      this.emit('error', error);
      this.close();
    }
  }
}
