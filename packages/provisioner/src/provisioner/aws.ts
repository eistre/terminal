import type { Task } from '@aws-sdk/client-ecs';
import type { AwsProvisionerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import type { ConnectionInfo, ContainerInfo } from '../provisioner.js';
import type { ContainerStatus } from './abstract.js';
import { DescribeNetworkInterfacesCommand, EC2Client } from '@aws-sdk/client-ec2';
import {
  DescribeTasksCommand,
  ECSClient,
  ListTasksCommand,
  RunTaskCommand,
  StopTaskCommand,
  TagResourceCommand,
} from '@aws-sdk/client-ecs';
import {
  CreateSecretCommand,
  DeleteSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  RestoreSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { AbstractProvisioner } from './abstract.js';

interface TaskStatusResult {
  status: ContainerStatus;
  task?: Task;
}

export class AwsProvisioner extends AbstractProvisioner {
  private static readonly TAG_APP_NAME = 'app';
  private static readonly TAG_COMPONENT = 'component';
  private static readonly TAG_VERSION = 'version';
  private static readonly TAG_MANAGED_BY = 'managed-by';
  private static readonly TAG_USER_ID = 'user-id';
  private static readonly TAG_EXPIRES_AT = 'expires-at';

  private static readonly MAX_TASK_READY_WAIT_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_TASK_DELETION_WAIT_MS = 2 * 60 * 1000; // 2 minutes
  private static readonly POLL_INTERVAL_MS = 5000; // 5 seconds - ECS state updates are slower than K8s

  private readonly ecs: ECSClient;
  private readonly ec2: EC2Client;
  private readonly secrets: SecretsManagerClient;
  private readonly region: AwsProvisionerSchema['PROVISIONER_AWS_REGION'];
  private readonly cluster: AwsProvisionerSchema['PROVISIONER_AWS_ECS_CLUSTER'];
  private readonly taskFamily: AwsProvisionerSchema['PROVISIONER_AWS_TASK_FAMILY'];
  private readonly subnets: AwsProvisionerSchema['PROVISIONER_AWS_SUBNETS'][];
  private readonly securityGroups: AwsProvisionerSchema['PROVISIONER_AWS_SECURITY_GROUPS'][];
  private readonly usePublicIp: AwsProvisionerSchema['PROVISIONER_AWS_USE_PUBLIC_IP'];

  constructor(logger: Logger, config: AwsProvisionerSchema) {
    super(logger.child({ module: 'aws', cluster: config.PROVISIONER_AWS_ECS_CLUSTER }), config);

    this.region = config.PROVISIONER_AWS_REGION;
    this.ecs = new ECSClient({ region: this.region });
    this.ec2 = new EC2Client({ region: this.region });
    this.secrets = new SecretsManagerClient({ region: this.region });

    this.cluster = config.PROVISIONER_AWS_ECS_CLUSTER;
    this.taskFamily = config.PROVISIONER_AWS_TASK_FAMILY;
    this.subnets = AwsProvisioner.splitList(config.PROVISIONER_AWS_SUBNETS);
    this.securityGroups = AwsProvisioner.splitList(config.PROVISIONER_AWS_SECURITY_GROUPS);
    this.usePublicIp = config.PROVISIONER_AWS_USE_PUBLIC_IP;
  }

  protected override async listContainersImpl(): Promise<ContainerInfo[]> {
    this.logger.debug('Listing ECS tasks');

    const tasks = await this.listManagedTasks();
    const containersByUser = new Map<string, { expiresAt: Date; task: Task }>();

    for (const { task, tags } of tasks) {
      const userId = tags[AwsProvisioner.TAG_USER_ID];
      const expiresAt = tags[AwsProvisioner.TAG_EXPIRES_AT];

      if (!userId || !expiresAt) {
        this.logger.warn({
          taskArn: task.taskArn,
          tags,
        }, 'Task missing user-id or expires-at tag');
        continue;
      }

      // Prefer RUNNING / the newest task per user to avoid acting on stale STOPPED tasks.
      const existing = containersByUser.get(userId);
      if (!existing || AwsProvisioner.isTaskPreferred(task, existing.task)) {
        containersByUser.set(userId, {
          expiresAt: new Date(expiresAt),
          task,
        });
      }
    }

    const containers = Array.from(containersByUser.entries())
      .map(([userId, value]) => ({
        userId,
        expiresAt: value.expiresAt,
      }));

    this.logger.info({ count: containers.length }, 'Listed ECS tasks');
    return containers;
  }

  protected override async ensureContainerExistsImpl(userId: string): Promise<ConnectionInfo> {
    const logger = this.logger.child({ userId });
    let task: Task;
    let privateKey: string;

    logger.info('Ensuring ECS task exists');
    const { status, task: existingTask } = await this.getTaskStatus(userId);
    logger.debug({ status }, 'Current task status');

    switch (status) {
      case 'TERMINATING': {
        logger.debug('Task is terminating, waiting for deletion');
        if (!existingTask?.taskArn) {
          AbstractProvisioner.abortRetry('Task ARN missing for terminating task');
        }
        await this.waitUntilTaskStopped(existingTask.taskArn);

        logger.debug('Task deletion complete, creating new task');
        const result = await this.createTask(userId);
        privateKey = result.privateKey;

        logger.debug('Task created, waiting for running status');
        task = await this.waitUntilTaskRunning(result.taskArn);
        break;
      }
      case 'MISSING': {
        logger.debug('Task does not exist, creating');
        const result = await this.createTask(userId);
        privateKey = result.privateKey;

        logger.debug('Task created, waiting for running status');
        task = await this.waitUntilTaskRunning(result.taskArn);
        break;
      }
      case 'PENDING': {
        logger.debug('Task is pending, waiting for running status');
        if (!existingTask?.taskArn) {
          AbstractProvisioner.abortRetry('Task ARN missing for pending task');
        }
        const [key, runningTask] = await Promise.all([
          this.getPrivateKey(userId),
          this.waitUntilTaskRunning(existingTask.taskArn),
          this.updateContainerExpirationImpl(userId),
        ]);
        privateKey = key;
        task = runningTask;
        break;
      }
      case 'RUNNING': {
        logger.debug('Task is running, updating expiration');
        const [key] = await Promise.all([
          this.getPrivateKey(userId),
          this.updateContainerExpirationImpl(userId),
        ]);
        privateKey = key;
        task = existingTask!;
        break;
      }
    }

    const ipAddress = await this.getTaskIp(task);
    if (!ipAddress) {
      AbstractProvisioner.abortRetry('Task IP address is not available');
    }

    logger.info('Task ready');
    return {
      userId,
      host: ipAddress,
      port: AbstractProvisioner.CONTAINER_SSH_PORT,
      username: AbstractProvisioner.CONTAINER_SSH_USERNAME,
      privateKey,
    };
  }

  protected override async updateContainerExpirationImpl(userId: string): Promise<void> {
    const logger = this.logger.child({ userId });
    const { status, task } = await this.getTaskStatus(userId);

    if (!task?.taskArn || status === 'MISSING') {
      AbstractProvisioner.abortRetry(`Task for user ${userId} not found`);
    }

    const expiresAt = AbstractProvisioner.getExpiresAt(this.containerExpiryMinutes);
    logger.debug({ expiresAt: expiresAt.toISOString() }, 'Updating task expiration');

    // Update the expires-at tag
    const updatedTags = [
      { key: AwsProvisioner.TAG_APP_NAME, value: this.appName },
      { key: AwsProvisioner.TAG_COMPONENT, value: AbstractProvisioner.COMPONENT_VALUE },
      { key: AwsProvisioner.TAG_VERSION, value: this.getVersionLabel() },
      { key: AwsProvisioner.TAG_MANAGED_BY, value: AbstractProvisioner.MANAGED_BY_VALUE },
      { key: AwsProvisioner.TAG_USER_ID, value: userId },
      { key: AwsProvisioner.TAG_EXPIRES_AT, value: expiresAt.toISOString() },
    ];

    await this.ecs.send(new TagResourceCommand({
      resourceArn: task.taskArn,
      tags: updatedTags,
    }));

    logger.info('Task expiration updated');
  }

  protected override async deleteContainerImpl(userId: string): Promise<void> {
    const logger = this.logger.child({ userId });
    const tasks = await this.listManagedTasks(userId);
    const activeTasks = tasks
      .map(entry => entry.task)
      .filter(task => task.taskArn && task.lastStatus !== 'STOPPED');

    await this.stopTasks(activeTasks, 'Terminal session cleanup', logger);
    const results = await Promise.allSettled(activeTasks.map(task => this.waitUntilTaskStopped(task.taskArn!)));

    if (results.some(result => result.status === 'rejected')) {
      try {
        const refreshed = await this.describeTasks(activeTasks.map(task => task.taskArn!));
        const stillActive = refreshed.filter(task => task.lastStatus && task.lastStatus !== 'STOPPED');
        if (stillActive.length > 0) {
          logger.warn({ stillActive: stillActive.map(task => task.taskArn) }, 'Skipping SSH key deletion because tasks are still running');
          return;
        }

        logger.warn('Proceeding with SSH key deletion after stop wait timeout because tasks appear stopped');
      }
      catch (error: unknown) {
        logger.warn({ error }, 'Skipping SSH key deletion because task stop verification failed');
        return;
      }
    }

    await this.deletePrivateKey(userId);
  }

  private async getTaskStatus(userId: string): Promise<TaskStatusResult> {
    const logger = this.logger.child({ userId });
    const tasks = await this.listManagedTasks(userId);

    if (tasks.length === 0) {
      return { status: 'MISSING' };
    }

    const preferred = tasks.map(entry => entry.task)
      .reduce((best, candidate) => {
        return AwsProvisioner.isTaskPreferred(candidate, best) ? candidate : best;
      });

    const activeTasks = tasks.map(entry => entry.task)
      .filter(task => task.taskArn && task.lastStatus !== 'STOPPED');

    if (activeTasks.length > 1) {
      const extraTasks = activeTasks.filter(task => task.taskArn !== preferred.taskArn);

      logger.warn({
        preferredTaskArn: preferred.taskArn,
        extraTaskArns: extraTasks.map(task => task.taskArn),
      }, 'Multiple active tasks detected; stopping extras');

      await this.stopTasks(extraTasks, 'Stopping duplicate tasks', logger);
    }

    const lastStatus = preferred.lastStatus;
    const healthStatus = preferred.healthStatus;

    logger.trace({ lastStatus, healthStatus }, 'Task status');

    if (lastStatus === 'RUNNING' && healthStatus === 'UNHEALTHY') {
      AbstractProvisioner.abortRetry('Task is unhealthy');
    }

    if (lastStatus === 'STOPPED') {
      return { status: 'MISSING' };
    }

    if (lastStatus === 'STOPPING' || lastStatus === 'DEPROVISIONING') {
      return { status: 'TERMINATING', task: preferred };
    }

    if (lastStatus === 'RUNNING' && healthStatus === 'HEALTHY') {
      return { status: 'RUNNING', task: preferred };
    }

    return { status: 'PENDING', task: preferred };
  }

  private async listTaskArns(userId?: string): Promise<string[]> {
    const taskArns: Set<string> = new Set();
    const additionalFilter = userId
      ? { startedBy: this.getStartedBy(userId) }
      : { family: this.taskFamily };

    for (const desiredStatus of ['RUNNING', 'STOPPED'] as const) {
      let nextToken: string | undefined;

      do {
        // noinspection JSUnusedAssignment
        const response = await this.ecs.send(new ListTasksCommand({
          cluster: this.cluster,
          desiredStatus,
          nextToken,
          ...additionalFilter,
        }));

        if (response.taskArns) {
          for (const taskArn of response.taskArns) {
            taskArns.add(taskArn);
          }
        }

        nextToken = response.nextToken;
      } while (nextToken);
    }

    return [...taskArns];
  }

  private async describeTasks(taskArns: string[]): Promise<Task[]> {
    const tasks: Task[] = [];
    for (let index = 0; index < taskArns.length; index += 100) {
      const chunk = taskArns.slice(index, index + 100);
      const response = await this.ecs.send(new DescribeTasksCommand({
        cluster: this.cluster,
        tasks: chunk,
        include: ['TAGS'],
      }));

      if (response.tasks) {
        tasks.push(...response.tasks);
      }
    }

    return tasks;
  }

  private async listManagedTasks(userId?: string): Promise<{ task: Task; tags: Record<string, string> }[]> {
    const taskArns = await this.listTaskArns(userId);
    const tasks = await this.describeTasks(taskArns);

    const managed: { task: Task; tags: Record<string, string> }[] = [];

    for (const task of tasks) {
      const tags: Record<string, string> = {};

      for (const tag of task.tags ?? []) {
        if (tag.key && tag.value) {
          tags[tag.key] = tag.value;
        }
      }

      if (tags[AwsProvisioner.TAG_MANAGED_BY] !== AbstractProvisioner.MANAGED_BY_VALUE
        || tags[AwsProvisioner.TAG_COMPONENT] !== AbstractProvisioner.COMPONENT_VALUE
        || tags[AwsProvisioner.TAG_APP_NAME] !== this.appName) {
        continue;
      }

      if (userId && tags[AwsProvisioner.TAG_USER_ID] !== userId) {
        continue;
      }

      managed.push({ task, tags });
    }

    return managed;
  }

  private async waitUntilTaskRunning(taskArn: string): Promise<Task> {
    const startTime = Date.now();
    const logger = this.logger.child({ taskArn });

    while (Date.now() - startTime < AwsProvisioner.MAX_TASK_READY_WAIT_MS) {
      const [task] = await this.describeTasks([taskArn]);
      if (!task) {
        AbstractProvisioner.abortRetry('Task disappeared while waiting for RUNNING');
      }

      const lastStatus = task.lastStatus;
      const healthStatus = task.healthStatus;

      logger.trace({ status: lastStatus }, 'Polling task status');

      if (lastStatus === 'RUNNING' && healthStatus === 'HEALTHY') {
        return task;
      }

      if (lastStatus === 'RUNNING' && healthStatus === 'UNHEALTHY') {
        AbstractProvisioner.abortRetry('Task became UNHEALTHY while waiting for readiness');
      }

      if (lastStatus === 'STOPPING' || lastStatus === 'STOPPED' || lastStatus === 'DEPROVISIONING') {
        AbstractProvisioner.abortRetry('Task terminated while waiting for RUNNING');
      }

      await AbstractProvisioner.sleep(AwsProvisioner.POLL_INTERVAL_MS);
    }

    AbstractProvisioner.abortRetry(`Timeout waiting for task ${taskArn} to be running after ${AwsProvisioner.MAX_TASK_READY_WAIT_MS}ms`);
  }

  private async waitUntilTaskStopped(taskArn: string): Promise<void> {
    const startTime = Date.now();
    const logger = this.logger.child({ taskArn });

    while (Date.now() - startTime < AwsProvisioner.MAX_TASK_DELETION_WAIT_MS) {
      const [task] = await this.describeTasks([taskArn]);
      logger.trace({ status: task?.lastStatus }, 'Polled task stop status');

      if (!task || task.lastStatus === 'STOPPED') {
        return;
      }

      await AbstractProvisioner.sleep(AwsProvisioner.POLL_INTERVAL_MS);
    }

    AbstractProvisioner.abortRetry(`Timeout waiting for task ${taskArn} to stop after ${AwsProvisioner.MAX_TASK_DELETION_WAIT_MS}ms`);
  }

  private async createTask(userId: string): Promise<{ privateKey: string; taskArn: string }> {
    const logger = this.logger.child({ userId });

    // Generate SSH keypair
    const { publicKey, privateKey } = AbstractProvisioner.generateKeypair();
    const expiresAt = AbstractProvisioner.getExpiresAt(this.containerExpiryMinutes);

    // Store private key in Secrets Manager
    await this.storePrivateKey(userId, privateKey);
    logger.debug('Stored private key in Secrets Manager');

    try {
      const response = await this.ecs.send(new RunTaskCommand({
        cluster: this.cluster,
        taskDefinition: this.taskFamily,
        launchType: 'FARGATE',
        count: 1,
        startedBy: this.getStartedBy(userId),
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: this.subnets,
            securityGroups: this.securityGroups,
            assignPublicIp: this.usePublicIp ? 'ENABLED' : 'DISABLED',
          },
        },
        overrides: {
          containerOverrides: [{
            name: AbstractProvisioner.CONTAINER_NAME,
            environment: [{
              name: 'SSH_PUBLIC_KEY',
              value: publicKey,
            }],
          }],
        },
        tags: [
          { key: AwsProvisioner.TAG_APP_NAME, value: this.appName },
          { key: AwsProvisioner.TAG_COMPONENT, value: AbstractProvisioner.COMPONENT_VALUE },
          { key: AwsProvisioner.TAG_VERSION, value: this.getVersionLabel() },
          { key: AwsProvisioner.TAG_MANAGED_BY, value: AbstractProvisioner.MANAGED_BY_VALUE },
          { key: AwsProvisioner.TAG_USER_ID, value: userId },
          { key: AwsProvisioner.TAG_EXPIRES_AT, value: expiresAt.toISOString() },
        ],
      }));

      if (response.failures && response.failures.length > 0) {
        AbstractProvisioner.abortRetry(`Failed to run task: ${response.failures[0].reason ?? 'Unknown error'}`);
      }

      const taskArn = response.tasks?.[0]?.taskArn;
      if (!taskArn) {
        AbstractProvisioner.abortRetry('Failed to start task: missing task ARN');
      }

      logger.info({ taskArn }, 'Task started');
      return { privateKey, taskArn };
    }
    catch (error: unknown) {
      // Clean up orphaned secret on task creation failure
      void this.deletePrivateKey(userId);
      throw error;
    }
  }

  private async storePrivateKey(userId: string, privateKey: string): Promise<void> {
    const secretName = this.getSecretName(userId);
    try {
      await this.secrets.send(new CreateSecretCommand({
        Name: secretName,
        SecretString: privateKey,
      }));
    }
    catch (error: unknown) {
      // If the secret is scheduled for deletion, restore it first
      if (AwsProvisioner.isScheduledForDeletion(error)) {
        await this.secrets.send(new RestoreSecretCommand({ SecretId: secretName }));
        await this.secrets.send(new PutSecretValueCommand({
          SecretId: secretName,
          SecretString: privateKey,
        }));

        return;
      }

      // If the secret already exists, just update its value
      if (AwsProvisioner.isAlreadyExists(error)) {
        await this.secrets.send(new PutSecretValueCommand({
          SecretId: secretName,
          SecretString: privateKey,
        }));

        return;
      }

      throw error;
    }
  }

  private async getPrivateKey(userId: string): Promise<string> {
    const secretName = this.getSecretName(userId);
    try {
      const response = await this.secrets.send(new GetSecretValueCommand({
        SecretId: secretName,
      }));

      const value = response.SecretString;
      if (!value) {
        AbstractProvisioner.abortRetry(`SSH key secret for user ${userId} has no value`);
      }

      return value;
    }
    catch (error: unknown) {
      if (AwsProvisioner.isNotFound(error)) {
        AbstractProvisioner.abortRetry(`SSH key for user ${userId} not found in Secrets Manager`);
      }

      throw error;
    }
  }

  private async deletePrivateKey(userId: string): Promise<void> {
    const secretName = this.getSecretName(userId);
    const logger = this.logger.child({ userId, secretName });
    try {
      await this.secrets.send(new DeleteSecretCommand({
        SecretId: secretName,
        ForceDeleteWithoutRecovery: true,
      }));
    }
    catch (error: unknown) {
      if (AwsProvisioner.isNotFound(error)) {
        return;
      }

      logger.warn({ error }, 'Failed to delete SSH key from Secrets Manager');
    }
  }

  private async getTaskPrivateIp(task: Task): Promise<string | undefined> {
    const details = task.attachments?.flatMap(attachment => attachment.details ?? []) ?? [];
    const privateIp = details.find(detail => detail.name === 'privateIPv4Address')?.value;
    if (privateIp) {
      return privateIp;
    }

    const eniId = details.find(detail => detail.name === 'networkInterfaceId')?.value;
    if (!eniId) {
      return undefined;
    }

    const response = await this.ec2.send(new DescribeNetworkInterfacesCommand({
      NetworkInterfaceIds: [eniId],
    }));
    return response.NetworkInterfaces?.[0]?.PrivateIpAddress;
  }

  private async getTaskPublicIp(task: Task): Promise<string | undefined> {
    const details = task.attachments?.flatMap(attachment => attachment.details ?? []) ?? [];
    const publicIp = details.find(detail => detail.name === 'publicIPv4Address')?.value;
    if (publicIp) {
      return publicIp;
    }

    const eniId = details.find(detail => detail.name === 'networkInterfaceId')?.value;
    if (!eniId) {
      return undefined;
    }

    const response = await this.ec2.send(new DescribeNetworkInterfacesCommand({
      NetworkInterfaceIds: [eniId],
    }));
    return response.NetworkInterfaces?.[0]?.Association?.PublicIp;
  }

  private async getTaskIp(task: Task): Promise<string | undefined> {
    if (this.usePublicIp) {
      const publicIp = await this.getTaskPublicIp(task);
      if (publicIp) {
        return publicIp;
      }

      this.logger.warn({ taskArn: task.taskArn }, 'Public IP not found - falling back to private IP');
    }

    return this.getTaskPrivateIp(task);
  }

  private async stopTasks(tasks: Task[], reason: string, logger: Logger): Promise<void> {
    await Promise.allSettled(tasks.map(async (task) => {
      if (!task.taskArn) {
        return;
      }

      try {
        await this.ecs.send(new StopTaskCommand({
          cluster: this.cluster,
          task: task.taskArn,
          reason,
        }));
        logger.debug({ taskArn: task.taskArn }, 'Task stop requested');
      }
      catch (error: unknown) {
        logger.warn({ error, taskArn: task.taskArn }, 'Failed to stop task');
      }
    }));
  }

  private getSecretName(userId: string): string {
    return `${this.appName}-session-${AbstractProvisioner.sanitizeUserId(userId)}`;
  }

  private getStartedBy(userId: string): string {
    return `${this.appName}:${AbstractProvisioner.sanitizeUserId(userId)}`;
  }

  private static splitList(value: string): string[] {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }

  private static isTaskPreferred(candidate: Task, current: Task): boolean {
    const isPending = (status?: string) => {
      return status === 'PENDING' || status === 'PROVISIONING' || status === 'ACTIVATING';
    };

    const isStopping = (status?: string) => {
      return status === 'STOPPING' || status === 'DEPROVISIONING' || status === 'DEACTIVATING';
    };

    const candidateStatus = candidate.lastStatus;
    const candidateHealth = candidate.healthStatus;
    const currentStatus = current.lastStatus;
    const currentHealth = current.healthStatus;

    // Both RUNNING - prefer by health status
    if (candidateStatus === 'RUNNING' && currentStatus === 'RUNNING' && candidateHealth !== currentHealth) {
      if (candidateHealth === 'HEALTHY') {
        return true;
      }
      if (currentHealth === 'HEALTHY') {
        return false;
      }
      if (candidateHealth === 'UNHEALTHY') {
        return false;
      }
      if (currentHealth === 'UNHEALTHY') {
        return true;
      }
    }

    // One RUNNING - prefer RUNNING unless unhealthy vs pending
    if (candidateStatus === 'RUNNING' && currentStatus !== 'RUNNING') {
      return candidateHealth !== 'UNHEALTHY' || !isPending(currentStatus);
    }

    // One RUNNING - prefer pending over unhealthy
    if (currentStatus === 'RUNNING' && candidateStatus !== 'RUNNING') {
      return currentHealth === 'UNHEALTHY' && isPending(candidateStatus);
    }

    // One PENDING - prefer PENDING unless unhealthy vs stopping
    if (isPending(candidateStatus) !== isPending(currentStatus)) {
      return isPending(candidateStatus);
    }

    // One STOPPING - prefer STOPPING unless stopping vs stopped
    if (isStopping(candidateStatus) !== isStopping(currentStatus)) {
      return isStopping(candidateStatus);
    }

    // One STOPPED - prefer non-STOPPED
    if (candidateStatus === 'STOPPED' || currentStatus === 'STOPPED') {
      return candidateStatus !== 'STOPPED';
    }

    // Finally, prefer by creation time
    const candidateCreated = candidate.createdAt?.getTime() ?? candidate.startedAt?.getTime() ?? 0;
    const currentCreated = current.createdAt?.getTime() ?? current.startedAt?.getTime() ?? 0;
    return candidateCreated > currentCreated;
  }

  private static isAlreadyExists(error: unknown): boolean {
    return AwsProvisioner.isAwsError(error, 'ResourceExistsException');
  }

  private static isNotFound(error: unknown): boolean {
    return AwsProvisioner.isAwsError(error, 'ResourceNotFoundException');
  }

  private static isScheduledForDeletion(error: unknown): boolean {
    if (!AwsProvisioner.isAwsError(error, 'InvalidRequestException')) {
      return false;
    }

    const message = (error as { message?: string }).message ?? '';
    return message.includes('scheduled for deletion');
  }

  private static isAwsError(error: unknown, name: string): boolean {
    return (error as { name?: string }).name === name;
  }
}
