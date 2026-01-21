import type { AwsProvisionerSchema } from './provisioner/aws.js';
import type { AzureProvisionerSchema } from './provisioner/azure.js';
import type { BaseProvisionerSchema } from './provisioner/base.js';
import type { KubernetesProvisionerSchema } from './provisioner/kubernetes.js';
import { z } from 'zod';
import { awsProvisionerSchema } from './provisioner/aws.js';
import { azureProvisionerSchema } from './provisioner/azure.js';
import { kubernetesProvisionerSchema } from './provisioner/kubernetes.js';

export const provisionerSchema = z.discriminatedUnion('PROVISIONER_TYPE', [
  awsProvisionerSchema,
  azureProvisionerSchema,
  kubernetesProvisionerSchema,
]);

export type ProvisionerSchema = z.infer<typeof provisionerSchema>;
export type { AwsProvisionerSchema, AzureProvisionerSchema, BaseProvisionerSchema, KubernetesProvisionerSchema };
