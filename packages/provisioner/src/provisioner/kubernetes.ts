import type { KubernetesProvisionerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import type { ConnectionInfo, ContainerInfo } from '../provisioner.js';
import { Buffer } from 'node:buffer';
import * as k8s from '@kubernetes/client-node';
import { AbstractProvisioner } from './abstract.js';

type PodStatus = 'EXISTING' | 'TERMINATING' | 'MISSING';

export class KubernetesProvisioner extends AbstractProvisioner {
  private static readonly POD_PREFIX = 'terminal-session';
  private static readonly COMPONENT_VALUE = 'session';
  private static readonly MANAGED_BY_VALUE = 'terminal-provisioner';

  private static readonly APP_NAME_LABEL_KEY = 'app.kubernetes.io/name';
  private static readonly INSTANCE_LABEL_KEY = 'app.kubernetes.io/instance';
  private static readonly COMPONENT_LABEL_KEY = 'app.kubernetes.io/component';
  private static readonly VERSION_LABEL_KEY = 'app.kubernetes.io/version';
  private static readonly MANAGED_BY_LABEL_KEY = 'app.kubernetes.io/managed-by';
  private static readonly USER_LABEL_KEY = 'app.terminal.io/user-id';
  private static readonly EXPIRES_AT_ANNOTATION_KEY = 'app.terminal.io/expires-at';

  private static readonly CONTAINER_NAME = 'terminal';
  private static readonly CONTAINER_SSH_PORT = 22;
  private static readonly CONTAINER_SSH_USERNAME = 'user';

  private static readonly MAX_POD_READY_WAIT_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_POD_DELETION_WAIT_MS = 2 * 60 * 1000; // 2 minutes
  private static readonly POLL_INTERVAL_MS = 1000; // 1 second

  private readonly api: k8s.CoreV1Api;
  private readonly namespace: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_NAMESPACE'];
  private readonly appName: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_APP_NAME'];
  private readonly releaseName: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_RELEASE_NAME'];
  private readonly serviceType: KubernetesProvisionerSchema['PROVISIONER_KUBERNETES_SERVICE_TYPE'];

  constructor(logger: Logger, config: KubernetesProvisionerSchema) {
    super(logger.child({ module: 'kubernetes', namespace: config.PROVISIONER_KUBERNETES_NAMESPACE }), config);

    // Initialize Kubernetes API client
    const kc = new k8s.KubeConfig();
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

    this.api = kc.makeApiClient(k8s.CoreV1Api);
    this.namespace = config.PROVISIONER_KUBERNETES_NAMESPACE;
    this.appName = config.PROVISIONER_KUBERNETES_APP_NAME;
    this.releaseName = config.PROVISIONER_KUBERNETES_RELEASE_NAME;
    this.serviceType = config.PROVISIONER_KUBERNETES_SERVICE_TYPE;
  }

  protected override async listContainersImpl(): Promise<ContainerInfo[]> {
    const labelSelector = `${KubernetesProvisioner.APP_NAME_LABEL_KEY}=${this.appName},`
      + `${KubernetesProvisioner.INSTANCE_LABEL_KEY}=${this.releaseName},`
      + `${KubernetesProvisioner.COMPONENT_LABEL_KEY}=${KubernetesProvisioner.COMPONENT_VALUE},`
      + `${KubernetesProvisioner.MANAGED_BY_LABEL_KEY}=${KubernetesProvisioner.MANAGED_BY_VALUE}`;

    this.logger.debug('Listing Kubernetes session pods');

    const response = await this.api.listNamespacedPod({ namespace: this.namespace, labelSelector });
    const containers: ContainerInfo[] = [];

    this.logger.trace({ podCount: response.items.length }, 'Fetched pods for listing containers');

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
        }, 'Found pod with missing userId label or expiresAt annotation');
        continue;
      }

      containers.push({
        userId,
        expiresAt: new Date(expiresAt),
      });
    }

    this.logger.info({ count: containers.length }, 'Listed Kubernetes session containers');
    return containers;
  }

  protected override async ensureContainerExistsImpl(userId: string): Promise<ConnectionInfo> {
    const podName = KubernetesProvisioner.getPodName(userId);
    const logger = this.logger.child({ userId, podName });
    let pod: k8s.V1Pod;
    let privateKey: string;

    logger.info('Ensuring pod exists');
    const status = await this.getPodStatus(podName);
    logger.debug({ status }, 'Current pod status before ensuring container');

    switch (status) {
      case 'TERMINATING': {
        logger.debug('Pod is terminating, waiting for deletion');
        await this.waitUntilPodTerminated(podName);

        logger.debug('Pod deletion complete, creating new pod');
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
      case 'EXISTING': {
        logger.debug('Pod exists, validating readiness and updating expiration');
        const result = await Promise.all([
          this.updateContainerExpirationImpl(userId),
          this.waitUntilPodReady(podName),
          this.getPrivateKey(userId),
        ]);
        pod = result[1];
        privateKey = result[2];
        break;
      }
    }

    let host: string;
    let port: number;

    switch (this.serviceType) {
      case 'headless': {
        const podIP = pod.status?.podIP;

        if (!podIP) {
          KubernetesProvisioner.abortRetry('Pod IP is not available');
        }

        host = podIP;
        port = KubernetesProvisioner.CONTAINER_SSH_PORT;
        logger.debug({ host, podIP }, 'Using pod IP directly for headless mode SSH connection');
        break;
      }
      case 'nodePort': {
        const serviceName = KubernetesProvisioner.getServiceName(userId);
        const service = await this.api.readNamespacedService({ name: serviceName, namespace: this.namespace });
        const nodePort = service.spec
          ?.ports
          ?.find(port => port.port === KubernetesProvisioner.CONTAINER_SSH_PORT)
          ?.nodePort;

        if (!nodePort) {
          KubernetesProvisioner.abortRetry(`Service ${serviceName} is missing nodePort for SSH`);
        }

        // Use externalIP if available, fallback to internalIP
        const nodes = await this.api.listNode();
        const node = nodes.items[0];
        const externalIP = node?.status?.addresses?.find(addr => addr.type === 'ExternalIP')?.address;
        const internalIP = node?.status?.addresses?.find(addr => addr.type === 'InternalIP')?.address;

        host = externalIP || internalIP || 'localhost';
        port = nodePort;
        logger.debug({ nodePort, externalIP, internalIP, selectedHost: host }, 'Using NodePort SSH connection info');
        break;
      }
    }

    logger.info('Pod ready for user');
    return {
      userId,
      host,
      port,
      username: KubernetesProvisioner.CONTAINER_SSH_USERNAME,
      privateKey,
    };
  }

  protected override async updateContainerExpirationImpl(userId: string): Promise<void> {
    const podName = KubernetesProvisioner.getPodName(userId);
    const logger = this.logger.child({ userId, podName });

    const expiresAt = KubernetesProvisioner.getExpiresAt(this.containerExpiryMinutes);
    logger.debug(`Updating pod expiration to ${expiresAt.toISOString()}`);

    // "app.terminal.io/expires-at" becomes "app~0terminal~0io~1expires-at"
    const annotation = KubernetesProvisioner.EXPIRES_AT_ANNOTATION_KEY
      .replace(/\./g, '~0')
      .replace(/\//g, '~1');

    const path = `/metadata/annotations/${annotation}`;

    await this.api.patchNamespacedPod({
      name: podName,
      namespace: this.namespace,
      body: [{
        op: 'replace',
        path,
        value: expiresAt.toISOString(),
      }],
    });

    logger.info('Pod expiration updated');
  }

  protected override async deleteContainerImpl(userId: string): Promise<void> {
    const podName = KubernetesProvisioner.getPodName(userId);
    const logger = this.logger.child({ userId, podName });

    try {
      logger.debug('Deleting pod (secret and service will cascade via ownerReferences)');

      // Deletes the pod (and its associated service via ownerReferences)
      await this.api.deleteNamespacedPod({ name: podName, namespace: this.namespace });
      logger.info('Pod deleted (secret and service cleanup in progress)');
    }
    catch (error: unknown) {
      if (KubernetesProvisioner.isNotFound(error)) {
        logger.debug('Pod not found, treating it as already deleted');
        return;
      }

      throw error;
    }
  }

  private async getPodStatus(podName: string): Promise<PodStatus> {
    const logger = this.logger.child({ podName });

    try {
      const pod = await this.api.readNamespacedPod({ name: podName, namespace: this.namespace });
      logger.trace({ phase: pod.status?.phase, deletionTimestamp: pod.metadata?.deletionTimestamp }, 'Read pod status');

      if (pod.metadata?.deletionTimestamp) {
        return 'TERMINATING';
      }

      return 'EXISTING';
    }
    catch (error: unknown) {
      if (KubernetesProvisioner.isNotFound(error)) {
        logger.trace('Pod not found when reading status');
        return 'MISSING';
      }

      throw error;
    }
  }

  private async getPrivateKey(userId: string): Promise<string> {
    const secretName = KubernetesProvisioner.getSecretName(userId);
    const logger = this.logger.child({ userId, secretName });

    try {
      const secret = await this.api.readNamespacedSecret({ name: secretName, namespace: this.namespace });
      const privateKey = secret.data?.privateKey;

      if (!privateKey) {
        KubernetesProvisioner.abortRetry(`Secret ${secretName} missing privateKey data`);
      }

      // Kubernetes secrets are base64 encoded
      const decoded = Buffer.from(privateKey, 'base64').toString('utf-8');
      logger.trace('Retrieved private key from secret');

      return decoded;
    }
    catch (error: unknown) {
      if (KubernetesProvisioner.isNotFound(error)) {
        KubernetesProvisioner.abortRetry(`Secret ${secretName} not found`);
      }

      throw error;
    }
  }

  private async createPod(userId: string): Promise<string> {
    const logger = this.logger.child({ userId });

    // Generate ephemeral keypair
    const { publicKey, privateKey } = KubernetesProvisioner.generateKeypair();
    logger.debug('Generated ephemeral Ed25519 keypair');

    // Create the pod with the public key
    const pod = await this.api.createNamespacedPod({
      namespace: this.namespace,
      body: this.buildPodManifest(userId, publicKey),
    });

    const podUid = pod.metadata?.uid;
    logger.debug({ podUid }, 'Created pod for user');

    if (!podUid) {
      KubernetesProvisioner.abortRetry('Pod UID is missing for newly created pod');
    }

    // Create the secret with the private key
    await this.api.createNamespacedSecret({
      namespace: this.namespace,
      body: this.buildSecretManifest(userId, podUid, privateKey),
    });
    logger.debug('Created secret for pod');

    // Only create service for NodePort mode
    if (this.serviceType === 'nodePort') {
      await this.api.createNamespacedService({ namespace: this.namespace, body: this.buildServiceManifest(userId, podUid) });
      logger.debug({ mode: this.serviceType }, 'Created service for user');
    }
    else {
      logger.debug({ mode: this.serviceType }, 'Skipping service creation for headless mode (using pod IP directly)');
    }

    return privateKey;
  }

  private async waitUntilPodReady(podName: string): Promise<k8s.V1Pod> {
    const startTime = Date.now();
    const logger = this.logger.child({ podName });

    while (Date.now() - startTime < KubernetesProvisioner.MAX_POD_READY_WAIT_MS) {
      const pod = await this.api.readNamespacedPod({ name: podName, namespace: this.namespace });
      const phase = pod.status?.phase;
      const containerStatus = pod.status
        ?.containerStatuses
        ?.find(status => status.name === KubernetesProvisioner.CONTAINER_NAME);

      logger.trace({
        phase,
        ready: containerStatus?.ready,
        restartCount: containerStatus?.restartCount,
      }, 'Polled pod readiness');

      // Abort on any terminal failure state
      if (phase === 'Failed') {
        AbstractProvisioner.abortRetry(`Pod failed: ${pod.status?.reason || 'Unknown'}`);
      }

      if (phase === 'Succeeded') {
        AbstractProvisioner.abortRetry('Pod completed successfully but should be long-running');
      }

      if (phase === 'Unknown') {
        AbstractProvisioner.abortRetry('Pod status unknown - possible API server issue');
      }

      if (phase === 'Running' && containerStatus?.ready) {
        logger.debug('Pod is Running and container is Ready');
        return pod;
      }

      await KubernetesProvisioner.sleep(KubernetesProvisioner.POLL_INTERVAL_MS);
    }

    AbstractProvisioner.abortRetry(`Timeout waiting for pod ${podName} to be ready after ${KubernetesProvisioner.MAX_POD_READY_WAIT_MS}ms`);
  }

  private async waitUntilPodTerminated(podName: string): Promise<void> {
    const startTime = Date.now();
    const logger = this.logger.child({ podName });

    while (Date.now() - startTime < KubernetesProvisioner.MAX_POD_DELETION_WAIT_MS) {
      const status = await this.getPodStatus(podName);
      logger.trace({ status }, 'Polled pod termination status');

      if (status === 'MISSING') {
        return;
      }

      await KubernetesProvisioner.sleep(KubernetesProvisioner.POLL_INTERVAL_MS);
    }

    AbstractProvisioner.abortRetry(`Timed out waiting for pod ${podName} to be deleted after ${KubernetesProvisioner.MAX_POD_DELETION_WAIT_MS}ms`);
  }

  private buildPodManifest(userId: string, publicKey: string): k8s.V1Pod {
    return {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: KubernetesProvisioner.getPodName(userId),
        namespace: this.namespace,
        labels: {
          [KubernetesProvisioner.APP_NAME_LABEL_KEY]: this.appName,
          [KubernetesProvisioner.INSTANCE_LABEL_KEY]: this.releaseName,
          [KubernetesProvisioner.COMPONENT_LABEL_KEY]: KubernetesProvisioner.COMPONENT_VALUE,
          [KubernetesProvisioner.VERSION_LABEL_KEY]: this.getVersionLabel(),
          [KubernetesProvisioner.MANAGED_BY_LABEL_KEY]: KubernetesProvisioner.MANAGED_BY_VALUE,
          [KubernetesProvisioner.USER_LABEL_KEY]: userId,
        },
        annotations: {
          [KubernetesProvisioner.EXPIRES_AT_ANNOTATION_KEY]: KubernetesProvisioner
            .getExpiresAt(this.containerExpiryMinutes)
            .toISOString(),
        },
      },
      spec: {
        hostname: KubernetesProvisioner.CONTAINER_NAME,
        containers: [{
          name: KubernetesProvisioner.CONTAINER_NAME,
          image: this.containerImage,
          imagePullPolicy: 'IfNotPresent',
          env: [{
            name: 'SSH_PUBLIC_KEY',
            value: publicKey,
          }],
          ports: [{
            name: 'ssh',
            containerPort: KubernetesProvisioner.CONTAINER_SSH_PORT,
          }],
          resources: {
            requests: {
              memory: this.containerMemoryRequest,
              cpu: this.containerCpuRequest,
            },
            limits: {
              memory: this.containerMemoryLimit,
              cpu: this.containerCpuLimit,
            },
          },
          readinessProbe: {
            tcpSocket: {
              port: KubernetesProvisioner.CONTAINER_SSH_PORT,
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

  private buildServiceManifest(userId: string, podUid: string): k8s.V1Service {
    const isNodePort = this.serviceType === 'nodePort';

    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: KubernetesProvisioner.getServiceName(userId),
        namespace: this.namespace,
        labels: {
          [KubernetesProvisioner.APP_NAME_LABEL_KEY]: this.appName,
          [KubernetesProvisioner.INSTANCE_LABEL_KEY]: this.releaseName,
          [KubernetesProvisioner.COMPONENT_LABEL_KEY]: KubernetesProvisioner.COMPONENT_VALUE,
          [KubernetesProvisioner.VERSION_LABEL_KEY]: this.getVersionLabel(),
          [KubernetesProvisioner.MANAGED_BY_LABEL_KEY]: KubernetesProvisioner.MANAGED_BY_VALUE,
          [KubernetesProvisioner.USER_LABEL_KEY]: userId,
        },
        ownerReferences: [{
          apiVersion: 'v1',
          kind: 'Pod',
          name: KubernetesProvisioner.getPodName(userId),
          uid: podUid,
          controller: true,
          blockOwnerDeletion: false,
        }],
      },
      spec: {
        type: isNodePort ? 'NodePort' : undefined,
        clusterIP: isNodePort ? undefined : 'None',
        selector: {
          [KubernetesProvisioner.APP_NAME_LABEL_KEY]: this.appName,
          [KubernetesProvisioner.INSTANCE_LABEL_KEY]: this.releaseName,
          [KubernetesProvisioner.COMPONENT_LABEL_KEY]: KubernetesProvisioner.COMPONENT_VALUE,
          [KubernetesProvisioner.USER_LABEL_KEY]: userId,
        },
        ports: [{
          name: 'ssh',
          port: KubernetesProvisioner.CONTAINER_SSH_PORT,
          targetPort: KubernetesProvisioner.CONTAINER_SSH_PORT,
          protocol: 'TCP',
        }],
      },
    };
  }

  private buildSecretManifest(userId: string, podUid: string, privateKey: string): k8s.V1Secret {
    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: KubernetesProvisioner.getSecretName(userId),
        namespace: this.namespace,
        labels: {
          [KubernetesProvisioner.APP_NAME_LABEL_KEY]: this.appName,
          [KubernetesProvisioner.INSTANCE_LABEL_KEY]: this.releaseName,
          [KubernetesProvisioner.COMPONENT_LABEL_KEY]: KubernetesProvisioner.COMPONENT_VALUE,
          [KubernetesProvisioner.VERSION_LABEL_KEY]: this.getVersionLabel(),
          [KubernetesProvisioner.MANAGED_BY_LABEL_KEY]: KubernetesProvisioner.MANAGED_BY_VALUE,
          [KubernetesProvisioner.USER_LABEL_KEY]: userId,
        },
        ownerReferences: [{
          apiVersion: 'v1',
          kind: 'Pod',
          name: KubernetesProvisioner.getPodName(userId),
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

  private static getExpiresAt(expiryMinutes: number): Date {
    const now = new Date();
    return new Date(now.getTime() + expiryMinutes * 60 * 1000);
  }

  private static getPodName(userId: string): string {
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return `${KubernetesProvisioner.POD_PREFIX}-${sanitizedUserId}`;
  }

  private static getServiceName(userId: string): string {
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return `${KubernetesProvisioner.POD_PREFIX}-${sanitizedUserId}-svc`;
  }

  private static getSecretName(userId: string): string {
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return `${KubernetesProvisioner.POD_PREFIX}-${sanitizedUserId}-secret`;
  }

  private getVersionLabel(): string {
    // Extract version from the container image tag
    // e.g., "ghcr.io/eistre/terminal-container:1.2.3" → "1.2.3"
    const parts = this.containerImage.split(':');
    return parts.length > 1 ? parts[1] : 'latest';
  }

  private static isNotFound(error: unknown): boolean {
    return (error as { code?: number }).code === 404;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
