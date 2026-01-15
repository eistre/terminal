import type { ProvisionerSchema } from '@terminal/env/schemas';
import type { Logger } from '@terminal/logger';
import type { Provisioner } from './provisioner.js';
import { AzureProvisioner } from './provisioner/azure.js';
import { KubernetesProvisioner } from './provisioner/kubernetes.js';

export type { ConnectionInfo, ContainerInfo, Provisioner } from './provisioner.js';

export function createProvisioner(
  logger: Logger,
  config: ProvisionerSchema,
): Provisioner {
  switch (config.PROVISIONER_TYPE) {
    case 'kubernetes':
      return new KubernetesProvisioner(logger, config);
    case 'azure':
      return new AzureProvisioner(logger, config);
    default:
      throw new Error(`Unsupported provisioner type: ${(config as ProvisionerSchema).PROVISIONER_TYPE}`);
  }
}
