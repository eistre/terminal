import { z } from 'zod';

export const baseProvisionerSchema = z.object({
  PROVISIONER_MAX_RETRIES: z.coerce.number().positive().default(3),
  PROVISIONER_CONCURRENCY_LIMIT: z.coerce.number().positive().default(10),
  PROVISIONER_CONTAINER_EXPIRY_MINUTES: z.coerce.number().positive().default(30),
  PROVISIONER_CONTAINER_IMAGE: z.string().default('ghcr.io/eistre/terminal-container:latest'),
  PROVISIONER_CONTAINER_MEMORY_REQUEST: z.string().default('64Mi'),
  PROVISIONER_CONTAINER_MEMORY_LIMIT: z.string().default('128Mi'),
  PROVISIONER_CONTAINER_CPU_REQUEST: z.string().default('100m'),
  PROVISIONER_CONTAINER_CPU_LIMIT: z.string().default('250m'),
});

export type BaseProvisionerSchema = z.infer<typeof baseProvisionerSchema>;
