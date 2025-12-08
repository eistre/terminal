import type { ConnectionInfo } from '@terminal/provisioner';
import type { ConnectConfig } from 'ssh2';
import type { Session } from './session';
import { Client } from 'ssh2';
import { SessionImpl } from './session';

const READY_TIMEOUT = 20 * 1000; // 20 seconds
const KEEPALIVE_INTERVAL = 15 * 1000; // 15 seconds
const KEEPALIVE_COUNT_MAX = 3;

export type { Session };

export interface SessionOptions extends ConnectionInfo {
  privateKey: string;
  rows?: number;
  cols?: number;
  term?: string;
}

export async function createSession(sessionOptions: SessionOptions): Promise<Session> {
  const { host, port, username, privateKey, rows, cols, term = 'xterm-256color' } = sessionOptions;

  const client = new Client();
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

    const fail = (error: unknown) => {
      if (resolved) {
        return;
      }

      client.end();

      resolved = true;
      reject(error);
    };

    // ECONNREFUSED / ECONNRESET / ETIMEDOUT
    client.once('error', (error) => {
      fail(error);
    });

    client.once('ready', () => {
      client.shell({ rows, cols, term }, (error, channel) => {
        if (error) {
          fail(error);
          return;
        }

        if (resolved) {
          channel.close();
          return;
        }

        resolved = true;
        resolve(new SessionImpl(client, channel));
      });
    });

    client.connect(config);
  });
}
