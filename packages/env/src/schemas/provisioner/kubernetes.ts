import { z } from 'zod';
import { baseProvisionerSchema } from './base';

export const kubernetesProvisionerSchema = baseProvisionerSchema.extend({
  PROVISIONER_TYPE: z.literal('kubernetes'),
  KUBECONFIG: z.string().optional(),
  KUBERNETES_SERVICE_HOST: z.string().optional(),
  KUBERNETES_NAMESPACE: z.string().default('default'),
  KUBERNETES_SERVICE_TYPE: z.enum(['headless', 'nodePort']).default('headless'),
});

export type KubernetesProvisionerSchema = z.infer<typeof kubernetesProvisionerSchema>;
