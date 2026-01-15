import type { ContainerGroup } from '@azure/arm-containerinstance';
import type { Container } from '@azure/cosmos';
import type { AzureProvisionerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import type { ConnectionInfo, ContainerInfo } from '../provisioner.js';
import type { ContainerStatus } from './abstract.js';
import { ContainerInstanceManagementClient } from '@azure/arm-containerinstance';
import { isRestError } from '@azure/core-rest-pipeline';
import { CosmosClient, ErrorResponse } from '@azure/cosmos';
import { ClientSecretCredential, DefaultAzureCredential } from '@azure/identity';
import { AbstractProvisioner } from './abstract.js';

interface SshKeyDocument {
  id: string;
  privateKey: string;
  ttl: number;
}

interface ContainerGroupStatusResult {
  status: ContainerStatus;
  containerGroup?: ContainerGroup;
}

export class AzureProvisioner extends AbstractProvisioner {
  private static readonly CONTAINER_GROUP_PREFIX = 'terminal-session';
  private static readonly CONTAINER_NAME = 'terminal';
  private static readonly CONTAINER_SSH_PORT = 22;
  private static readonly CONTAINER_SSH_USERNAME = 'user';

  // Azure-specific tag keys (equivalent to Kubernetes labels)
  private static readonly TAG_APP_NAME = 'app';
  private static readonly TAG_COMPONENT = 'component';
  private static readonly TAG_VERSION = 'version';
  private static readonly TAG_MANAGED_BY = 'managed-by';
  private static readonly TAG_USER_ID = 'user-id';
  private static readonly TAG_EXPIRES_AT = 'expires-at';

  private static readonly MAX_CONTAINER_READY_WAIT_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CONTAINER_DELETION_WAIT_MS = 2 * 60 * 1000; // 2 minutes
  private static readonly POLL_INTERVAL_MS = 5000; // 5 seconds - ACI state updates are slower than K8s

  private readonly aci: ContainerInstanceManagementClient;
  private readonly cosmos: Container;
  private readonly resourceGroup: AzureProvisionerSchema['PROVISIONER_AZURE_RESOURCE_GROUP'];
  private readonly location: AzureProvisionerSchema['PROVISIONER_AZURE_LOCATION'];
  private readonly subnetId: AzureProvisionerSchema['PROVISIONER_AZURE_SUBNET_ID'];

  constructor(logger: Logger, config: AzureProvisionerSchema) {
    super(logger.child({ module: 'azure', resourceGroup: config.PROVISIONER_AZURE_RESOURCE_GROUP }), config);

    // Initialize Azure credentials
    const credential = config.PROVISIONER_AZURE_USE_MANAGED_IDENTITY
      ? new DefaultAzureCredential()
      : new ClientSecretCredential(
          config.PROVISIONER_AZURE_TENANT_ID!,
          config.PROVISIONER_AZURE_CLIENT_ID!,
          config.PROVISIONER_AZURE_CLIENT_SECRET!,
        );

    // Initialize ACI client
    this.aci = new ContainerInstanceManagementClient(credential, config.PROVISIONER_AZURE_SUBSCRIPTION_ID);
    this.logger.debug('Initialized Azure Container Instance client');

    // Initialize Cosmos DB client
    const cosmosClient = new CosmosClient({
      endpoint: config.PROVISIONER_AZURE_COSMOS_ENDPOINT,
      aadCredentials: credential,
    });
    this.cosmos = cosmosClient.database(config.PROVISIONER_AZURE_COSMOS_DATABASE).container(config.PROVISIONER_AZURE_COSMOS_CONTAINER);
    this.logger.debug('Initialized Cosmos DB client');

    this.resourceGroup = config.PROVISIONER_AZURE_RESOURCE_GROUP;
    this.location = config.PROVISIONER_AZURE_LOCATION;
    this.subnetId = config.PROVISIONER_AZURE_SUBNET_ID;
  }

  protected override async listContainersImpl(): Promise<ContainerInfo[]> {
    this.logger.debug('Listing container groups');

    const containers: ContainerInfo[] = [];
    const containerGroups = this.aci.containerGroups.listByResourceGroup(this.resourceGroup);

    for await (const group of containerGroups) {
      const tags = group.tags ?? {};

      // Only include containers managed by this provisioner
      if (tags[AzureProvisioner.TAG_MANAGED_BY] !== AbstractProvisioner.MANAGED_BY_VALUE
        || tags[AzureProvisioner.TAG_COMPONENT] !== AbstractProvisioner.COMPONENT_VALUE) {
        continue;
      }

      const userId = tags[AzureProvisioner.TAG_USER_ID];
      const expiresAt = tags[AzureProvisioner.TAG_EXPIRES_AT];

      if (!userId || !expiresAt) {
        this.logger.warn({
          containerGroupName: group.name,
          tags,
        }, 'Container group missing user-id or expires-at tag');
        continue;
      }

      containers.push({
        userId,
        expiresAt: new Date(expiresAt),
      });
    }

    this.logger.info({ count: containers.length }, 'Listed container groups');
    return containers;
  }

  protected override async ensureContainerExistsImpl(userId: string): Promise<ConnectionInfo> {
    const containerGroupName = AzureProvisioner.getContainerGroupName(userId);
    const logger = this.logger.child({ userId, containerGroupName });
    let containerGroup: ContainerGroup;
    let privateKey: string;

    logger.info('Ensuring container exists');
    const { status, containerGroup: existingContainerGroup } = await this.getContainerGroupStatus(containerGroupName);
    logger.debug({ status }, 'Current container status');

    switch (status) {
      case 'TERMINATING': {
        logger.debug('Container is terminating, waiting for deletion');
        await this.waitUntilContainerGroupDeleted(containerGroupName);

        logger.debug('Container deletion complete, creating new container');
        privateKey = await this.createContainerGroup(userId);

        logger.debug('Container created, waiting for running status');
        containerGroup = await this.waitUntilContainerGroupRunning(containerGroupName);
        break;
      }
      case 'MISSING': {
        logger.debug('Container does not exist, creating');
        privateKey = await this.createContainerGroup(userId);

        logger.debug('Container created, waiting for running status');
        containerGroup = await this.waitUntilContainerGroupRunning(containerGroupName);
        break;
      }
      case 'PENDING': {
        logger.debug('Container is pending, waiting for running status and retrieving existing key');
        const [key, runningContainerGroup] = await Promise.all([
          this.getPrivateKey(userId),
          this.waitUntilContainerGroupRunning(containerGroupName),
          this.updateContainerExpirationImpl(userId),
        ]);
        privateKey = key;
        containerGroup = runningContainerGroup;
        break;
      }
      case 'RUNNING': {
        logger.debug('Container exists, validating and updating expiration');
        const [key] = await Promise.all([
          this.getPrivateKey(userId),
          this.updateContainerExpirationImpl(userId),
        ]);
        privateKey = key;
        containerGroup = existingContainerGroup!;
        break;
      }
    }

    const ipAddress = containerGroup.ipAddress?.ip;

    if (!ipAddress) {
      AbstractProvisioner.abortRetry('Container IP address is not available');
    }

    logger.info('Container ready');
    return {
      userId,
      host: ipAddress,
      port: AzureProvisioner.CONTAINER_SSH_PORT,
      username: AzureProvisioner.CONTAINER_SSH_USERNAME,
      privateKey,
    };
  }

  protected override async updateContainerExpirationImpl(userId: string): Promise<void> {
    const containerGroupName = AzureProvisioner.getContainerGroupName(userId);
    const logger = this.logger.child({ userId, containerGroupName });

    const expiresAt = AbstractProvisioner.getExpiresAt(this.containerExpiryMinutes);
    const ttlSeconds = this.containerExpiryMinutes * 60;
    logger.debug({ expiresAt: expiresAt.toISOString() }, 'Updating container expiration');

    // Update the expires-at tag
    const updatedTags = {
      [AzureProvisioner.TAG_APP_NAME]: this.appName,
      [AzureProvisioner.TAG_COMPONENT]: AbstractProvisioner.COMPONENT_VALUE,
      [AzureProvisioner.TAG_VERSION]: this.getVersionLabel(),
      [AzureProvisioner.TAG_MANAGED_BY]: AbstractProvisioner.MANAGED_BY_VALUE,
      [AzureProvisioner.TAG_USER_ID]: userId,
      [AzureProvisioner.TAG_EXPIRES_AT]: expiresAt.toISOString(),
    };

    await Promise.all([
      this.aci.containerGroups.update(
        this.resourceGroup,
        containerGroupName,
        { tags: updatedTags },
      ),
      // Update TTL in Cosmos DB (patch operation resets TTL countdown)
      this.cosmos.item(userId, userId)
        .patch([{ op: 'replace', path: '/ttl', value: ttlSeconds }])
        .catch((error: unknown) => {
          logger.warn({ error }, 'Failed to update Cosmos DB TTL');
        }),
    ]);

    logger.info('Container expiration updated');
  }

  protected override async deleteContainerImpl(userId: string): Promise<void> {
    const containerGroupName = AzureProvisioner.getContainerGroupName(userId);
    const logger = this.logger.child({ userId, containerGroupName });

    try {
      logger.debug('Deleting container');
      await this.aci.containerGroups.beginDeleteAndWait(this.resourceGroup, containerGroupName);
      logger.info('Container deleted');
    }
    catch (error: unknown) {
      if (AzureProvisioner.isNotFound(error)) {
        logger.debug('Container not found, treating as already deleted');
      }
      else {
        throw error;
      }
    }

    try {
      await this.cosmos.item(userId, userId).delete();
      logger.debug('SSH key deleted from Cosmos DB');
    }
    catch (error: unknown) {
      if (AzureProvisioner.isNotFound(error)) {
        logger.debug('SSH key not found in Cosmos DB, treating as already deleted');
        return;
      }

      logger.warn({ error }, 'Failed to delete SSH key from Cosmos DB');
    }
  }

  private async getContainerGroupStatus(containerGroupName: string): Promise<ContainerGroupStatusResult> {
    const logger = this.logger.child({ containerGroupName });

    try {
      const containerGroup = await this.aci.containerGroups.get(this.resourceGroup, containerGroupName);
      const provisioningState = containerGroup.provisioningState;
      const instanceState = containerGroup.containers?.[0]?.instanceView?.currentState?.state;

      logger.trace({ provisioningState, instanceState }, 'Container status');

      if (provisioningState === 'Deleting') {
        return { status: 'TERMINATING', containerGroup };
      }

      // Abort on terminal failure states
      if (provisioningState === 'Failed') {
        const events = containerGroup.containers?.[0]?.instanceView?.events ?? [];
        AbstractProvisioner.abortRetry(`Container failed: ${events[events.length - 1].message || 'Unknown'}`);
      }
      if (instanceState === 'Terminated') {
        AbstractProvisioner.abortRetry(`Container terminated unexpectedly`);
      }

      if (provisioningState === 'Succeeded' && instanceState === 'Running') {
        return { status: 'RUNNING', containerGroup };
      }

      return { status: 'PENDING', containerGroup };
    }
    catch (error: unknown) {
      if (AzureProvisioner.isNotFound(error)) {
        logger.trace('Container not found');
        return { status: 'MISSING' };
      }

      throw error;
    }
  }

  private async getPrivateKey(userId: string): Promise<string> {
    const logger = this.logger.child({ userId });

    try {
      const { resource } = await this.cosmos.item(userId, userId).read<SshKeyDocument>();

      if (!resource?.privateKey) {
        AbstractProvisioner.abortRetry(`SSH key entry for user ${userId} missing privateKey`);
      }

      logger.trace('Retrieved private key from Cosmos DB');
      return resource.privateKey;
    }
    catch (error: unknown) {
      if (AzureProvisioner.isNotFound(error)) {
        AbstractProvisioner.abortRetry(`SSH key for user ${userId} not found in Cosmos DB`);
      }

      throw error;
    }
  }

  private async createContainerGroup(userId: string): Promise<string> {
    const containerGroupName = AzureProvisioner.getContainerGroupName(userId);
    const logger = this.logger.child({ userId, containerGroupName });

    // Generate ephemeral keypair
    const { publicKey, privateKey } = AbstractProvisioner.generateKeypair();
    logger.debug('Generated ephemeral Ed25519 keypair');

    const expiresAt = AbstractProvisioner.getExpiresAt(this.containerExpiryMinutes);
    const ttlSeconds = this.containerExpiryMinutes * 60;

    // Store the private key in Cosmos DB with TTL
    const sshKeyDocument: SshKeyDocument = {
      id: userId,
      privateKey,
      ttl: ttlSeconds,
    };

    await this.cosmos.items.upsert(sshKeyDocument);
    logger.debug('Stored private key with TTL');

    // Create the container group
    await this.aci.containerGroups.beginCreateOrUpdateAndWait(
      this.resourceGroup,
      containerGroupName,
      {
        location: this.location,
        tags: {
          [AzureProvisioner.TAG_APP_NAME]: this.appName,
          [AzureProvisioner.TAG_COMPONENT]: AbstractProvisioner.COMPONENT_VALUE,
          [AzureProvisioner.TAG_VERSION]: this.getVersionLabel(),
          [AzureProvisioner.TAG_MANAGED_BY]: AbstractProvisioner.MANAGED_BY_VALUE,
          [AzureProvisioner.TAG_USER_ID]: userId,
          [AzureProvisioner.TAG_EXPIRES_AT]: expiresAt.toISOString(),
        },
        osType: 'Linux',
        restartPolicy: 'OnFailure',
        ipAddress: {
          type: 'Private',
          ports: [{
            protocol: 'TCP',
            port: AzureProvisioner.CONTAINER_SSH_PORT,
          }],
        },
        subnetIds: [{
          id: this.subnetId,
        }],
        containers: [{
          name: AzureProvisioner.CONTAINER_NAME,
          image: this.containerImage,
          environmentVariables: [{
            name: 'SSH_PUBLIC_KEY',
            value: publicKey,
          }],
          ports: [{
            protocol: 'TCP',
            port: AzureProvisioner.CONTAINER_SSH_PORT,
          }],
          resources: {
            requests: {
              cpu: AzureProvisioner.parseCpu(this.containerCpuRequest),
              memoryInGB: AzureProvisioner.parseMemory(this.containerMemoryRequest),
            },
            limits: {
              cpu: AzureProvisioner.parseCpu(this.containerCpuLimit),
              memoryInGB: AzureProvisioner.parseMemory(this.containerMemoryLimit),
            },
          },
        }],
      },
    );

    logger.info('Container created');
    return privateKey;
  }

  private async waitUntilContainerGroupRunning(containerGroupName: string): Promise<ContainerGroup> {
    const startTime = Date.now();
    const logger = this.logger.child({ containerGroupName });

    while (Date.now() - startTime < AzureProvisioner.MAX_CONTAINER_READY_WAIT_MS) {
      const { status, containerGroup } = await this.getContainerGroupStatus(containerGroupName);
      logger.trace({ status }, 'Polled container status');

      if (status === 'RUNNING') {
        logger.debug('Container is running');
        return containerGroup!;
      }

      if (status === 'MISSING') {
        AbstractProvisioner.abortRetry(`Container ${containerGroupName} was deleted while waiting`);
      }

      if (status === 'TERMINATING') {
        AbstractProvisioner.abortRetry(`Container ${containerGroupName} is being deleted while waiting`);
      }

      await AbstractProvisioner.sleep(AzureProvisioner.POLL_INTERVAL_MS);
    }

    AbstractProvisioner.abortRetry(`Timeout waiting for container ${containerGroupName} to be running after ${AzureProvisioner.MAX_CONTAINER_READY_WAIT_MS}ms`);
  }

  private async waitUntilContainerGroupDeleted(containerGroupName: string): Promise<void> {
    const startTime = Date.now();
    const logger = this.logger.child({ containerGroupName });

    while (Date.now() - startTime < AzureProvisioner.MAX_CONTAINER_DELETION_WAIT_MS) {
      const { status } = await this.getContainerGroupStatus(containerGroupName);
      logger.trace({ status }, 'Polled container deletion status');

      if (status === 'MISSING') {
        logger.debug('Container deletion complete');
        return;
      }

      await AbstractProvisioner.sleep(AzureProvisioner.POLL_INTERVAL_MS);
    }

    AbstractProvisioner.abortRetry(`Timeout waiting for container ${containerGroupName} to be deleted after ${AzureProvisioner.MAX_CONTAINER_DELETION_WAIT_MS}ms`);
  }

  private static getContainerGroupName(userId: string): string {
    return `${AzureProvisioner.CONTAINER_GROUP_PREFIX}-${AbstractProvisioner.sanitizeUserId(userId)}`;
  }

  /**
   * Parse Kubernetes-style CPU format (e.g., "100m", "0.5", "1") to number of cores for Azure.
   */
  private static parseCpu(cpu: string): number {
    if (cpu.endsWith('m')) {
      // Millicores to cores
      return Number.parseInt(cpu.slice(0, -1), 10) / 1000;
    }
    return Number.parseFloat(cpu);
  }

  /**
   * Parse Kubernetes-style memory format (e.g., "64Mi", "128Mi", "1Gi") to GB for Azure.
   */
  private static parseMemory(memory: string): number {
    if (memory.endsWith('Gi')) {
      return Number.parseFloat(memory.slice(0, -2));
    }
    if (memory.endsWith('Mi')) {
      return Number.parseFloat(memory.slice(0, -2)) / 1024;
    }
    if (memory.endsWith('Ki')) {
      return Number.parseFloat(memory.slice(0, -2)) / (1024 * 1024);
    }
    // Assume bytes
    return Number.parseFloat(memory) / (1024 * 1024 * 1024);
  }

  private static isNotFound(error: unknown): boolean {
    // ACI uses RestError with statusCode
    if (isRestError(error) && error.statusCode === 404) {
      return true;
    }
    // Cosmos uses ErrorResponse with code
    return error instanceof ErrorResponse && error.code === 404;
  }
}
