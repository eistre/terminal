import type { BaseProvisionerSchema } from './provisioner/base';
import type { KubernetesProvisionerSchema } from './provisioner/kubernetes';
import { z } from 'zod';
import { kubernetesProvisionerSchema } from './provisioner/kubernetes';

export const provisionerSchema = z.discriminatedUnion('PROVISIONER_TYPE', [
  kubernetesProvisionerSchema,
]);

export type ProvisionerSchema = z.infer<typeof provisionerSchema>;
export type { BaseProvisionerSchema, KubernetesProvisionerSchema };
