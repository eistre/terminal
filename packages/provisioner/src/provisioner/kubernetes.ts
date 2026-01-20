import type { V1Pod, V1Secret, V1Service } from '@kubernetes/client-node';
import type { KubernetesProvisionerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import type { ConnectionInfo, ContainerInfo } from '../provisioner.js';
import type { ContainerStatus } from './abstract.js';
import { Buffer } from 'node:buffer';
import { ApiException, CoreV1Api, KubeConfig } from '@kubernetes/client-node';
import { AbstractProvisioner } from './abstract.js';

interface PodStatusResult {
  status: ContainerStatus;
  pod?: V1Pod;
}

export class KubernetesProvisioner extends AbstractProvisioner {
  private static readonly APP_NAME_LABEL_KEY = 'app.kubernetes.io/name';
  private static readonly INSTANCE_LABEL_KEY = 'app.kubernetes.io/instance';
  private static readonly COMPONENT_LABEL_KEY = 'app.kubernetes.io/component';
  private static readonly VERSION_LABEL_KEY = 'app.kubernetes.io/version';
  private static readonly MANAGED_BY_LABEL_KEY = 'app.kubernetes.io/managed-by';
  private static readonly USER_LABEL_KEY = 'app.terminal.io/user-id';
  private static readonly EXPIRES_AT_ANNOTATION_KEY = 'app.terminal.io/expires-at';

  private static readonly MAX_POD_READY_WAIT_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_POD_DELETION_WAIT_MS = 2 * 60 * 1000; // 2 minutes
  private static readonly POLL_INTERVAL_MS = 1000; // 1 second - K8s API updates quickly

  private readonly api: CoreV1Api;
  private readonly namespace: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_NAMESPACE'];
  private readonly releaseName: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_RELEASE_NAME'];
  private readonly sessionPrefix: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_SESSION_PREFIX'];
  private readonly serviceType: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_SERVICE_TYPE'];
  private readonly cpuRequest: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_CPU_REQUEST'];
  private readonly cpuLimit: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_CPU_LIMIT'];
  private readonly memoryRequest: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_MEMORY_REQUEST'];
  private readonly memoryLimit: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_MEMORY_LIMIT'];

  constructor(logger: Logger, config: KubernetesProvisionerSchema) {
    super(logger.child({ module: 'kubernetes', namespace: config.PROVISIONER_KUBERNETES_NAMESPACE }), config);

    // Initialize Kubernetes API client
    const kc = new KubeConfig();
    if (config.KUBERNETES_SERVICE_HOST) {
      kc.loadFromCluster();
      this.logger.debug('Loaded Kubernetes config from cluster');
    }
    else if (config.KUBECONFIG) {
      kc.loadFromFile(config.KUBECONFIG);
      this.logger.debug('Loaded Kubernetes config from file');
    }
    else {
      kc.loadFromDefault();
      this.logger.debug('Loaded default Kubernetes config');
    }

    this.api = kc.makeApiClient(CoreV1Api);
    this.namespace = config.PROVISIONER_KUBERNETES_NAMESPACE;
    this.releaseName = config.PROVISIONER_KUBERNETES_RELEASE_NAME;
    this.sessionPrefix = config.PROVISIONER_KUBERNETES_SESSION_PREFIX;
    this.serviceType = config.PROVISIONER_KUBERNETES_SERVICE_TYPE;
    this.cpuRequest = config.PROVISIONER_KUBERNETES_CPU_REQUEST;
    this.cpuLimit = config.PROVISIONER_KUBERNETES_CPU_LIMIT;
    this.memoryRequest = config.PROVISIONER_KUBERNETES_MEMORY_REQUEST;
    this.memoryLimit = config.PROVISIONER_KUBERNETES_MEMORY_LIMIT;
  }

  protected override async listContainersImpl(): Promise<ContainerInfo[]> {
    const labelSelector = `${KubernetesProvisioner.APP_NAME_LABEL_KEY}=${this.appName},`
      + `${KubernetesProvisioner.INSTANCE_LABEL_KEY}=${this.releaseName},`
      + `${KubernetesProvisioner.COMPONENT_LABEL_KEY}=${AbstractProvisioner.COMPONENT_VALUE},`
      + `${KubernetesProvisioner.MANAGED_BY_LABEL_KEY}=${AbstractProvisioner.MANAGED_BY_VALUE}`;

    this.logger.debug('Listing session pods');

    const containers: ContainerInfo[] = [];
    const response = await this.api.listNamespacedPod({ namespace: this.namespace, labelSelector });

    for (const pod of response.items) {
      const podName = pod.metadata?.name;
      const labels = pod.metadata?.labels ?? {};
      const annotations = pod.metadata?.annotations ?? {};

      const userId = labels[KubernetesProvisioner.USER_LABEL_KEY];
      const expiresAt = annotations[KubernetesProvisioner.EXPIRES_AT_ANNOTATION_KEY];

      if (!userId || !expiresAt) {
        this.logger.warn({
          podName,
          labels,
          annotations,
        }, 'Pod missing userId label or expiresAt annotation');
        continue;
      }

      containers.push({
        userId,
        expiresAt: new Date(expiresAt),
      });
    }

    this.logger.info({ count: containers.length }, 'Listed session pods');
    return containers;
  }

  protected override async ensureContainerExistsImpl(userId: string): Promise<ConnectionInfo> {
    const podName = this.getPodName(userId);
    const logger = this.logger.child({ userId, podName });
    let pod: V1Pod;
    let privateKey: string;

    logger.info('Ensuring pod exists');
    const { status, pod: existingPod } = await this.getContainerStatus(podName);
    logger.debug({ status }, 'Current pod status');

    switch (status) {
      case 'TERMINATING': {
        logger.debug('Pod is terminating, waiting for deletion');
        await this.waitUntilPodTerminated(podName);

        logger.debug('Pod deleted, creating new pod');
        privateKey = await this.createPod(userId);

        logger.debug('Pod created, waiting for ready status');
        pod = await this.waitUntilPodReady(podName);
        break;
      }
      case 'MISSING': {
        logger.debug('Pod does not exist, creating');
        privateKey = await this.createPod(userId);

        logger.debug('Pod created, waiting for ready status');
        pod = await this.waitUntilPodReady(podName);
        break;
      }
      case 'PENDING': {
        logger.debug('Pod is pending, waiting for ready status');
        const [key, readyPod] = await Promise.all([
          this.getPrivateKey(userId),
          this.waitUntilPodReady(podName),
          this.updateContainerExpirationImpl(userId),
        ]);
        privateKey = key;
        pod = readyPod;
        break;
      }
      case 'RUNNING': {
        logger.debug('Pod is running, updating expiration');
        const [key] = await Promise.all([
          this.getPrivateKey(userId),
          this.updateContainerExpirationImpl(userId),
        ]);
        privateKey = key;
        pod = existingPod!;
        break;
      }
    }

    let host: string;
    let port: number;

    switch (this.serviceType) {
      case 'headless': {
        const podIP = pod.status?.podIP;

        if (!podIP) {
          AbstractProvisioner.abortRetry('Pod IP is not available');
        }

        host = podIP;
        port = AbstractProvisioner.CONTAINER_SSH_PORT;
        logger.debug({ host, podIP }, 'Using pod IP for headless mode');
        break;
      }
      case 'nodePort': {
        const serviceName = this.getServiceName(userId);
        const service = await this.api.readNamespacedService({ name: serviceName, namespace: this.namespace });
        const nodePort = service.spec
          ?.ports
          ?.find(port => port.port === AbstractProvisioner.CONTAINER_SSH_PORT)
          ?.nodePort;

        if (!nodePort) {
          AbstractProvisioner.abortRetry(`Service ${serviceName} is missing nodePort for SSH`);
        }

        // Use externalIP if available, fallback to internalIP
        const nodes = await this.api.listNode();
        const node = nodes.items[0];
        const externalIP = node?.status?.addresses?.find(addr => addr.type === 'ExternalIP')?.address;
        const internalIP = node?.status?.addresses?.find(addr => addr.type === 'InternalIP')?.address;

        host = externalIP || internalIP || 'localhost';
        port = nodePort;
        logger.debug({ nodePort, externalIP, internalIP, selectedHost: host }, 'Using NodePort mode');
        break;
      }
    }

    logger.info('Pod ready');
    return {
      userId,
      host,
      port,
      username: AbstractProvisioner.CONTAINER_SSH_USERNAME,
      privateKey,
    };
  }

  protected override async updateContainerExpirationImpl(userId: string): Promise<void> {
    const podName = this.getPodName(userId);
    const logger = this.logger.child({ userId, podName });

    const expiresAt = AbstractProvisioner.getExpiresAt(this.containerExpiryMinutes);
    logger.debug({ expiresAt: expiresAt.toISOString() }, 'Updating pod expiration');

    // "app.terminal.io/expires-at" becomes "app.terminal.io~1expires-at"
    const annotation = KubernetesProvisioner.EXPIRES_AT_ANNOTATION_KEY
      .replace(/\//g, '~1');

    await this.api.patchNamespacedPod({
      name: podName,
      namespace: this.namespace,
      body: [{
        op: 'replace',
        path: `/metadata/annotations/${annotation}`,
        value: expiresAt.toISOString(),
      }],
    });

    logger.info('Pod expiration updated');
  }

  protected override async deleteContainerImpl(userId: string): Promise<void> {
    const podName = this.getPodName(userId);
    const logger = this.logger.child({ userId, podName });

    try {
      logger.debug('Deleting pod (secret and service cascade via ownerReferences)');
      await this.api.deleteNamespacedPod({ name: podName, namespace: this.namespace });
      logger.info('Pod deleted');
    }
    catch (error: unknown) {
      if (KubernetesProvisioner.isNotFound(error)) {
        logger.debug('Pod not found, already deleted');
        return;
      }

      throw error;
    }
  }

  private async getContainerStatus(podName: string): Promise<PodStatusResult> {
    const logger = this.logger.child({ podName });

    try {
      const pod = await this.api.readNamespacedPod({ name: podName, namespace: this.namespace });
      const phase = pod.status?.phase;
      const containerStatus = pod.status?.containerStatuses
        ?.find(status => status.name === AbstractProvisioner.CONTAINER_NAME);

      logger.trace({ phase, deletionTimestamp: pod.metadata?.deletionTimestamp, ready: containerStatus?.ready }, 'Pod status');

      if (pod.metadata?.deletionTimestamp) {
        return { status: 'TERMINATING', pod };
      }

      // Abort on terminal failure states
      if (phase === 'Failed') {
        AbstractProvisioner.abortRetry(`Pod failed: ${pod.status?.reason || 'Unknown'}`);
      }
      if (phase === 'Succeeded') {
        AbstractProvisioner.abortRetry('Pod completed unexpectedly');
      }
      if (phase === 'Unknown') {
        AbstractProvisioner.abortRetry('Pod status unknown');
      }

      if (phase === 'Running' && containerStatus?.ready) {
        return { status: 'RUNNING', pod };
      }

      return { status: 'PENDING', pod };
    }
    catch (error: unknown) {
      if (KubernetesProvisioner.isNotFound(error)) {
        logger.trace('Pod not found');
        return { status: 'MISSING' };
      }

      throw error;
    }
  }

  private async getPrivateKey(userId: string): Promise<string> {
    const secretName = this.getSecretName(userId);
    const logger = this.logger.child({ userId, secretName });

    try {
      const secret = await this.api.readNamespacedSecret({ name: secretName, namespace: this.namespace });
      const privateKey = secret.data?.privateKey;

      if (!privateKey) {
        AbstractProvisioner.abortRetry(`Secret ${secretName} missing privateKey data`);
      }

      // Kubernetes secrets are base64 encoded
      logger.trace('Retrieved private key from secret');
      return Buffer.from(privateKey, 'base64').toString('utf-8');
    }
    catch (error: unknown) {
      if (KubernetesProvisioner.isNotFound(error)) {
        AbstractProvisioner.abortRetry(`Secret ${secretName} not found`);
      }

      throw error;
    }
  }

  private async createPod(userId: string): Promise<string> {
    const logger = this.logger.child({ userId });

    // Generate ephemeral keypair
    const { publicKey, privateKey } = AbstractProvisioner.generateKeypair();
    logger.debug('Generated ephemeral Ed25519 keypair');

    // Create the pod with the public key
    const pod = await this.api.createNamespacedPod({
      namespace: this.namespace,
      body: this.buildPodManifest(userId, publicKey),
    });

    const podUid = pod.metadata?.uid;
    logger.debug({ podUid }, 'Created pod');

    if (!podUid) {
      AbstractProvisioner.abortRetry('Pod UID is missing for newly created pod');
    }

    // Create the secret with the private key
    await this.api.createNamespacedSecret({
      namespace: this.namespace,
      body: this.buildSecretManifest(userId, podUid, privateKey),
    });
    logger.debug('Created secret');

    // Only create service for NodePort mode
    if (this.serviceType === 'nodePort') {
      await this.api.createNamespacedService({ namespace: this.namespace, body: this.buildServiceManifest(userId, podUid) });
      logger.debug('Created service for NodePort mode');
    }
    else {
      logger.debug('Skipping service creation for headless mode');
    }

    return privateKey;
  }

  private async waitUntilPodReady(podName: string): Promise<V1Pod> {
    const startTime = Date.now();
    const logger = this.logger.child({ podName });

    while (Date.now() - startTime < KubernetesProvisioner.MAX_POD_READY_WAIT_MS) {
      const { status, pod } = await this.getContainerStatus(podName);
      logger.trace({ status }, 'Polled pod status');

      if (status === 'RUNNING') {
        logger.debug('Pod is running and ready');
        return pod!;
      }

      if (status === 'MISSING') {
        AbstractProvisioner.abortRetry(`Pod ${podName} was deleted while waiting`);
      }

      if (status === 'TERMINATING') {
        AbstractProvisioner.abortRetry(`Pod ${podName} is being deleted while waiting`);
      }

      await AbstractProvisioner.sleep(KubernetesProvisioner.POLL_INTERVAL_MS);
    }

    AbstractProvisioner.abortRetry(`Timeout waiting for pod ${podName} to be ready after ${KubernetesProvisioner.MAX_POD_READY_WAIT_MS}ms`);
  }

  private async waitUntilPodTerminated(podName: string): Promise<void> {
    const startTime = Date.now();
    const logger = this.logger.child({ podName });

    while (Date.now() - startTime < KubernetesProvisioner.MAX_POD_DELETION_WAIT_MS) {
      const { status } = await this.getContainerStatus(podName);
      logger.trace({ status }, 'Polled pod deletion');

      if (status === 'MISSING') {
        logger.debug('Pod deletion complete');
        return;
      }

      await AbstractProvisioner.sleep(KubernetesProvisioner.POLL_INTERVAL_MS);
    }

    AbstractProvisioner.abortRetry(`Timeout waiting for pod ${podName} to be deleted after ${KubernetesProvisioner.MAX_POD_DELETION_WAIT_MS}ms`);
  }

  private buildPodManifest(userId: string, publicKey: string): V1Pod {
    return {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: this.getPodName(userId),
        namespace: this.namespace,
        labels: {
          [KubernetesProvisioner.APP_NAME_LABEL_KEY]: this.appName,
          [KubernetesProvisioner.INSTANCE_LABEL_KEY]: this.releaseName,
          [KubernetesProvisioner.COMPONENT_LABEL_KEY]: AbstractProvisioner.COMPONENT_VALUE,
          [KubernetesProvisioner.VERSION_LABEL_KEY]: this.getVersionLabel(),
          [KubernetesProvisioner.MANAGED_BY_LABEL_KEY]: AbstractProvisioner.MANAGED_BY_VALUE,
          [KubernetesProvisioner.USER_LABEL_KEY]: userId,
        },
        annotations: {
          [KubernetesProvisioner.EXPIRES_AT_ANNOTATION_KEY]: AbstractProvisioner
            .getExpiresAt(this.containerExpiryMinutes)
            .toISOString(),
        },
      },
      spec: {
        containers: [{
          name: AbstractProvisioner.CONTAINER_NAME,
          image: this.containerImage,
          imagePullPolicy: 'IfNotPresent',
          env: [{
            name: 'SSH_PUBLIC_KEY',
            value: publicKey,
          }],
          ports: [{
            name: 'ssh',
            containerPort: AbstractProvisioner.CONTAINER_SSH_PORT,
          }],
          resources: {
            requests: {
              memory: this.memoryRequest,
              cpu: this.cpuRequest,
            },
            limits: {
              memory: this.memoryLimit,
              cpu: this.cpuLimit,
            },
          },
          readinessProbe: {
            tcpSocket: {
              port: AbstractProvisioner.CONTAINER_SSH_PORT,
            },
            initialDelaySeconds: 3,
            periodSeconds: 3,
            failureThreshold: 3,
          },
        }],
        restartPolicy: 'OnFailure',
      },
    };
  }

  private buildServiceManifest(userId: string, podUid: string): V1Service {
    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: this.getServiceName(userId),
        namespace: this.namespace,
        labels: {
          [KubernetesProvisioner.APP_NAME_LABEL_KEY]: this.appName,
          [KubernetesProvisioner.INSTANCE_LABEL_KEY]: this.releaseName,
          [KubernetesProvisioner.COMPONENT_LABEL_KEY]: AbstractProvisioner.COMPONENT_VALUE,
          [KubernetesProvisioner.VERSION_LABEL_KEY]: this.getVersionLabel(),
          [KubernetesProvisioner.MANAGED_BY_LABEL_KEY]: AbstractProvisioner.MANAGED_BY_VALUE,
          [KubernetesProvisioner.USER_LABEL_KEY]: userId,
        },
        ownerReferences: [{
          apiVersion: 'v1',
          kind: 'Pod',
          name: this.getPodName(userId),
          uid: podUid,
          controller: true,
          blockOwnerDeletion: false,
        }],
      },
      spec: {
        type: 'NodePort',
        selector: {
          [KubernetesProvisioner.APP_NAME_LABEL_KEY]: this.appName,
          [KubernetesProvisioner.INSTANCE_LABEL_KEY]: this.releaseName,
          [KubernetesProvisioner.COMPONENT_LABEL_KEY]: AbstractProvisioner.COMPONENT_VALUE,
          [KubernetesProvisioner.USER_LABEL_KEY]: userId,
        },
        ports: [{
          name: 'ssh',
          port: AbstractProvisioner.CONTAINER_SSH_PORT,
          targetPort: AbstractProvisioner.CONTAINER_SSH_PORT,
          protocol: 'TCP',
        }],
      },
    };
  }

  private buildSecretManifest(userId: string, podUid: string, privateKey: string): V1Secret {
    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: this.getSecretName(userId),
        namespace: this.namespace,
        labels: {
          [KubernetesProvisioner.APP_NAME_LABEL_KEY]: this.appName,
          [KubernetesProvisioner.INSTANCE_LABEL_KEY]: this.releaseName,
          [KubernetesProvisioner.COMPONENT_LABEL_KEY]: AbstractProvisioner.COMPONENT_VALUE,
          [KubernetesProvisioner.VERSION_LABEL_KEY]: this.getVersionLabel(),
          [KubernetesProvisioner.MANAGED_BY_LABEL_KEY]: AbstractProvisioner.MANAGED_BY_VALUE,
          [KubernetesProvisioner.USER_LABEL_KEY]: userId,
        },
        ownerReferences: [{
          apiVersion: 'v1',
          kind: 'Pod',
          name: this.getPodName(userId),
          uid: podUid,
          controller: false,
          blockOwnerDeletion: true,
        }],
      },
      type: 'Opaque',
      stringData: {
        privateKey,
      },
    };
  }

  private getPodName(userId: string): string {
    return `${this.sessionPrefix}-${AbstractProvisioner.sanitizeUserId(userId)}`;
  }

  private getServiceName(userId: string): string {
    return `${this.sessionPrefix}-${AbstractProvisioner.sanitizeUserId(userId)}-svc`;
  }

  private getSecretName(userId: string): string {
    return `${this.sessionPrefix}-${AbstractProvisioner.sanitizeUserId(userId)}-secret`;
  }

  private static isNotFound(error: unknown): boolean {
    return error instanceof ApiException && error.code === 404;
  }
}
