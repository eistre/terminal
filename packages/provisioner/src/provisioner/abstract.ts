import type { BaseProvisionerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import type { ConnectionInfo, ContainerInfo, Provisioner } from '../provisioner.js';
import pLimit from 'p-limit';
import pRetry, { AbortError } from 'p-retry';

export abstract class AbstractProvisioner implements Provisioner {
  protected readonly logger: Logger;
  protected readonly containerExpiryMinutes: BaseProvisionerSchema['PROVISIONER_CONTAINER_EXPIRY_MINUTES'];
  protected readonly containerImage: BaseProvisionerSchema['PROVISIONER_CONTAINER_IMAGE'];
  protected readonly containerMemoryRequest: BaseProvisionerSchema['PROVISIONER_CONTAINER_MEMORY_REQUEST'];
  protected readonly containerCpuRequest: BaseProvisionerSchema['PROVISIONER_CONTAINER_CPU_REQUEST'];
  protected readonly containerMemoryLimit: BaseProvisionerSchema['PROVISIONER_CONTAINER_MEMORY_LIMIT'];
  protected readonly containerCpuLimit: BaseProvisionerSchema['PROVISIONER_CONTAINER_CPU_LIMIT'];
  protected readonly containerSshPublicKey: BaseProvisionerSchema['PROVISIONER_CONTAINER_SSH_PUBLIC_KEY'];

  private readonly concurrencyLimit;
  private readonly maxRetries;
  private readonly locks = new Map<string, Promise<void>>();

  protected constructor(logger: Logger, config: BaseProvisionerSchema) {
    this.logger = logger;
    this.concurrencyLimit = pLimit(config.PROVISIONER_CONCURRENCY_LIMIT);
    this.maxRetries = config.PROVISIONER_MAX_RETRIES;
    this.containerExpiryMinutes = config.PROVISIONER_CONTAINER_EXPIRY_MINUTES;
    this.containerImage = config.PROVISIONER_CONTAINER_IMAGE;
    this.containerMemoryRequest = config.PROVISIONER_CONTAINER_MEMORY_REQUEST;
    this.containerCpuRequest = config.PROVISIONER_CONTAINER_CPU_REQUEST;
    this.containerMemoryLimit = config.PROVISIONER_CONTAINER_MEMORY_LIMIT;
    this.containerCpuLimit = config.PROVISIONER_CONTAINER_CPU_LIMIT;
    this.containerSshPublicKey = config.PROVISIONER_CONTAINER_SSH_PUBLIC_KEY;
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
   * @param clientId Unique identifier for the client
   */
  async ensureContainerExists(clientId: string): Promise<ConnectionInfo> {
    return this.withConcurrencyLimit(() =>
      this.withLock(clientId, () =>
        this.withRetry(() => this.ensureContainerExistsImpl(clientId))),
    );
  }

  /**
   * @inheritDoc
   * @param clientId Unique identifier for the client
   */
  async updateContainerExpiration(clientId: string): Promise<void> {
    return this.withConcurrencyLimit(() =>
      this.withLock(clientId, () =>
        this.withRetry(() => this.updateContainerExpirationImpl(clientId))),
    );
  }

  /**
   * @inheritDoc
   * @param clientId Unique identifier for the client
   */
  async deleteContainer(clientId: string): Promise<void> {
    return this.withConcurrencyLimit(() =>
      this.withLock(clientId, () =>
        this.withRetry(() => this.deleteContainerImpl(clientId))),
    );
  }

  protected abstract listContainersImpl(): Promise<ContainerInfo[]>;

  protected abstract ensureContainerExistsImpl(clientId: string): Promise<ConnectionInfo>;

  protected abstract updateContainerExpirationImpl(clientId: string): Promise<void>;

  protected abstract deleteContainerImpl(clientId: string): Promise<void>;

  protected withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
    return this.concurrencyLimit(fn);
  }

  protected withLock<T>(clientId: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(clientId) ?? Promise.resolve();

    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(clientId, current);

    return previous
      .then(fn)
      .finally(() => {
        release();
        if (this.locks.get(clientId) === current) {
          this.locks.delete(clientId);
        }
      });
  }

  protected withRetry<T>(fn: () => Promise<T>): Promise<T> {
    return pRetry(fn, {
      retries: this.maxRetries,
      randomize: true,
    });
  }

  protected static abortRetry(error: string | Error): never {
    throw new AbortError(error);
  }
}
