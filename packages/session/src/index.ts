import type { ConnectionInfo } from '@terminal/provisioner';
import type { ClientChannel, ConnectConfig } from 'ssh2';
import type { Session } from './session.ts';
import { Client } from 'ssh2';
import { SessionImpl } from './session.js';

const READY_TIMEOUT = 20 * 1000; // 20 seconds
const KEEPALIVE_INTERVAL = 15 * 1000; // 15 seconds
const KEEPALIVE_COUNT_MAX = 3;

export type { Session };

export interface SessionOptions extends ConnectionInfo {
  privateKey: string;
  execCommand?: string;
  rows?: number;
  cols?: number;
  term?: string;
}

export async function createSession(sessionOptions: SessionOptions): Promise<Session> {
  const { host, port, username, privateKey, execCommand, rows, cols, term = 'xterm-256color' } = sessionOptions;

  const client = new Client();
  const trimmedExecCommand = execCommand?.trim();
  const config: ConnectConfig = {
    host,
    port,
    username,
    privateKey,
    readyTimeout: READY_TIMEOUT,
    keepaliveInterval: KEEPALIVE_INTERVAL,
    keepaliveCountMax: KEEPALIVE_COUNT_MAX,
  };

  return new Promise<Session>((resolve, reject) => {
    let resolved = false;

    let shellChannel: ClientChannel | null = null;
    let execChannel: ClientChannel | null = null;

    const fail = (error: unknown) => {
      if (resolved) {
        return;
      }

      resolved = true;

      if (shellChannel) {
        shellChannel.close();
        shellChannel = null;
      }

      if (execChannel) {
        execChannel.close();
        execChannel = null;
      }

      client.end();
      reject(error);
    };

    const maybeResolve = () => {
      if (resolved || !shellChannel) {
        return;
      }

      if (trimmedExecCommand && !execChannel) {
        return;
      }

      resolved = true;
      const session = new SessionImpl(client, shellChannel, execChannel);

      client.off('error', fail);
      resolve(session);
    };

    // ECONNREFUSED / ECONNRESET / ETIMEDOUT
    client.once('error', fail);

    client.once('ready', () => {
      if (trimmedExecCommand) {
        client.exec(trimmedExecCommand, (error, channel) => {
          if (error) {
            fail(error);
            return;
          }

          if (resolved) {
            channel.close();
            return;
          }

          execChannel = channel;
          maybeResolve();
        });
      }

      client.shell({ rows, cols, term }, (error, channel) => {
        if (error) {
          fail(error);
          return;
        }

        if (resolved) {
          channel.close();
          return;
        }

        shellChannel = channel;
        maybeResolve();
      });
    });

    client.connect(config);
  });
}
