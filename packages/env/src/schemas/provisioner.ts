import type { AzureProvisionerSchema } from './provisioner/azure.ts';
import type { BaseProvisionerSchema } from './provisioner/base.ts';
import type { KubernetesProvisionerSchema } from './provisioner/kubernetes.ts';
import { z } from 'zod';
import { azureProvisionerSchema } from './provisioner/azure.ts';
import { kubernetesProvisionerSchema } from './provisioner/kubernetes.ts';

export const provisionerSchema = z.discriminatedUnion('PROVISIONER_TYPE', [
  kubernetesProvisionerSchema,
  azureProvisionerSchema,
]);

export type ProvisionerSchema = z.infer<typeof provisionerSchema>;
export type { AzureProvisionerSchema, BaseProvisionerSchema, KubernetesProvisionerSchema };
