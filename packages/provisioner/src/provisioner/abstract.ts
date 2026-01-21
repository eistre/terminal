import type { BaseProvisionerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import type { ConnectionInfo, ContainerInfo, Provisioner } from '../provisioner.js';
import pLimit from 'p-limit';
import pRetry, { AbortError } from 'p-retry';
import sshpk from 'sshpk';

/**
 * Unified container status type across all provisioner implementations.
 */
export type ContainerStatus = 'RUNNING' | 'PENDING' | 'TERMINATING' | 'MISSING';

export abstract class AbstractProvisioner implements Provisioner {
  // Shared label/tag values for identifying managed containers
  protected static readonly CONTAINER_NAME = 'terminal';
  protected static readonly CONTAINER_SSH_PORT = 22;
  protected static readonly CONTAINER_SSH_USERNAME = 'user';
  protected static readonly COMPONENT_VALUE = 'session';
  protected static readonly MANAGED_BY_VALUE = 'terminal-provisioner';

  protected readonly logger: Logger;
  protected readonly appName: BaseProvisionerSchema['PROVISIONER_APP_NAME'];
  protected readonly containerExpiryMinutes: BaseProvisionerSchema['PROVISIONER_CONTAINER_EXPIRY_MINUTES'];
  protected readonly containerImage: BaseProvisionerSchema['PROVISIONER_CONTAINER_IMAGE'];

  private readonly concurrencyLimit;
  private readonly maxRetries;
  private readonly locks = new Map<string, Promise<void>>();

  protected constructor(logger: Logger, config: BaseProvisionerSchema) {
    this.logger = logger;
    this.concurrencyLimit = pLimit(config.PROVISIONER_CONCURRENCY_LIMIT);
    this.maxRetries = config.PROVISIONER_MAX_RETRIES;
    this.appName = config.PROVISIONER_APP_NAME;
    this.containerExpiryMinutes = config.PROVISIONER_CONTAINER_EXPIRY_MINUTES;
    this.containerImage = config.PROVISIONER_CONTAINER_IMAGE;
  }

  /**
   * @inheritDoc
   */
  async listContainers(): Promise<ContainerInfo[]> {
    return this.withConcurrencyLimit(() =>
      this.withRetry(() => this.listContainersImpl()),
    );
  }

  /**
   * @inheritDoc
   * @param userId Unique identifier for the user
   */
  async ensureContainerExists(userId: string): Promise<ConnectionInfo> {
    return this.withConcurrencyLimit(() =>
      this.withLock(userId, () =>
        this.withRetry(() => this.ensureContainerExistsImpl(userId))),
    );
  }

  /**
   * @inheritDoc
   * @param userId Unique identifier for the user
   */
  async updateContainerExpiration(userId: string): Promise<void> {
    return this.withConcurrencyLimit(() =>
      this.withLock(userId, () =>
        this.withRetry(() => this.updateContainerExpirationImpl(userId))),
    );
  }

  /**
   * @inheritDoc
   * @param userId Unique identifier for the user
   */
  async deleteContainer(userId: string): Promise<void> {
    return this.withConcurrencyLimit(() =>
      this.withLock(userId, () =>
        this.withRetry(() => this.deleteContainerImpl(userId))),
    );
  }

  protected abstract listContainersImpl(): Promise<ContainerInfo[]>;

  protected abstract ensureContainerExistsImpl(userId: string): Promise<ConnectionInfo>;

  protected abstract updateContainerExpirationImpl(userId: string): Promise<void>;

  protected abstract deleteContainerImpl(userId: string): Promise<void>;

  protected withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
    return this.concurrencyLimit(fn);
  }

  protected withLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(userId) ?? Promise.resolve();

    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(userId, current);

    return previous
      .then(fn)
      .finally(() => {
        release();
        if (this.locks.get(userId) === current) {
          this.locks.delete(userId);
        }
      });
  }

  protected withRetry<T>(fn: () => Promise<T>): Promise<T> {
    return pRetry(fn, {
      retries: this.maxRetries,
      randomize: true,
    });
  }

  /**
   * Extract version from the container image tag.
   * @example "ghcr.io/eistre/terminal-container:1.2.3" → "1.2.3"
   */
  protected getVersionLabel(): string {
    const parts = this.containerImage.split(':');
    return parts.length > 1 ? parts[1] : 'latest';
  }

  /**
   * Generate an ephemeral Ed25519 SSH keypair.
   * @returns Object containing public and private keys in SSH format
   */
  protected static generateKeypair(): { publicKey: string; privateKey: string } {
    const privateKeyObj = sshpk.generatePrivateKey('ed25519');

    return {
      publicKey: privateKeyObj.toPublic().toString('ssh'),
      privateKey: privateKeyObj.toString('openssh'),
    };
  }

  protected static abortRetry(error: string | Error): never {
    throw new AbortError(error);
  }

  /**
   * Sanitize userId for use in resource names.
   * Converts to lowercase and replaces invalid characters with hyphens.
   */
  protected static sanitizeUserId(userId: string): string {
    return userId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /**
   * Calculate expiration timestamp from current time plus expiry minutes.
   */
  protected static getExpiresAt(expiryMinutes: number): Date {
    const now = new Date();
    return new Date(now.getTime() + expiryMinutes * 60 * 1000);
  }

  /**
   * Sleep for the specified number of milliseconds.
   */
  protected static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
