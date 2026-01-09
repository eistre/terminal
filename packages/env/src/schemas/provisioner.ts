import type { BaseProvisionerSchema } from './provisioner/base.ts';
import type { KubernetesProvisionerSchema } from './provisioner/kubernetes.ts';
import { z } from 'zod';
import { kubernetesProvisionerSchema } from './provisioner/kubernetes.ts';

export const provisionerSchema = z.discriminatedUnion('PROVISIONER_TYPE', [
  kubernetesProvisionerSchema,
]);

export type ProvisionerSchema = z.infer<typeof provisionerSchema>;
export type { BaseProvisionerSchema, KubernetesProvisionerSchema };
