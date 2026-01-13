import { z } from 'zod';
import { baseProvisionerSchema } from './base.ts';

export const kubernetesProvisionerSchema = baseProvisionerSchema.extend({
  PROVISIONER_TYPE: z.literal('kubernetes'),
  KUBECONFIG: z.string().optional(),
  KUBERNETES_SERVICE_HOST: z.string().optional(),
  PROVISIONER_KUBERNETES_NAMESPACE: z.string().default('default'),
  PROVISIONER_KUBERNETES_APP_NAME: z.string().min(1).default('terminal'),
  PROVISIONER_KUBERNETES_RELEASE_NAME: z.string().min(1).default('terminal'),
  PROVISIONER_KUBERNETES_SERVICE_TYPE: z.enum(['headless', 'nodePort']).default('headless'),
});

export type KubernetesProvisionerSchema = z.infer<typeof kubernetesProvisionerSchema>;
