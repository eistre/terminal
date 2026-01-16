import { z } from 'zod';
import { baseProvisionerSchema } from './base.js';

// Kubernetes resource format patterns (basic validation, K8s validates fully itself)
// CPU: digits, optional decimal, optional 'm' suffix (e.g., '100m', '0.5', '1')
const k8sCpuPattern = /^\d+((\.\d+)|m)?$/;

// Memory: digits with optional decimal and valid K8s suffix
const k8sMemoryPattern = /^\d+(\.\d+)?([EPTGMk]|Ei|Pi|Ti|Gi|Mi|Ki)?$/;

export const kubernetesProvisionerSchema = baseProvisionerSchema.extend({
  PROVISIONER_TYPE: z.literal('kubernetes'),

  KUBECONFIG: z.string().optional(),
  KUBERNETES_SERVICE_HOST: z.string().optional(),

  PROVISIONER_KUBERNETES_NAMESPACE: z.string().min(1).default('default'),
  PROVISIONER_KUBERNETES_RELEASE_NAME: z.string().min(1).default('terminal'),
  PROVISIONER_KUBERNETES_SESSION_PREFIX: z.string().min(1).default('terminal-session'),
  PROVISIONER_KUBERNETES_SERVICE_TYPE: z.enum(['headless', 'nodePort']).default('headless'),

  PROVISIONER_KUBERNETES_CPU_REQUEST: z.string().regex(k8sCpuPattern).default('100m'),
  PROVISIONER_KUBERNETES_CPU_LIMIT: z.string().regex(k8sCpuPattern).default('250m'),
  PROVISIONER_KUBERNETES_MEMORY_REQUEST: z.string().regex(k8sMemoryPattern).default('64Mi'),
  PROVISIONER_KUBERNETES_MEMORY_LIMIT: z.string().regex(k8sMemoryPattern).default('128Mi'),
});

export type KubernetesProvisionerSchema = z.infer<typeof kubernetesProvisionerSchema>;
