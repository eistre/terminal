import type { AzureProvisionerSchema } from './provisioner/azure.js';
import type { BaseProvisionerSchema } from './provisioner/base.js';
import type { KubernetesProvisionerSchema } from './provisioner/kubernetes.js';
import { z } from 'zod';
import { azureProvisionerSchema } from './provisioner/azure.js';
import { kubernetesProvisionerSchema } from './provisioner/kubernetes.js';

export const provisionerSchema = z.discriminatedUnion('PROVISIONER_TYPE', [
  kubernetesProvisionerSchema,
  azureProvisionerSchema,
]);

export type ProvisionerSchema = z.infer<typeof provisionerSchema>;
export type { AzureProvisionerSchema, BaseProvisionerSchema, KubernetesProvisionerSchema };
