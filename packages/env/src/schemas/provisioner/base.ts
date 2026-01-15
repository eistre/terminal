import { z } from 'zod';

export const baseProvisionerSchema = z.object({
  PROVISIONER_APP_NAME: z.string().min(1).default('terminal'),
  PROVISIONER_MAX_RETRIES: z.coerce.number().positive().default(3),
  PROVISIONER_CONCURRENCY_LIMIT: z.coerce.number().positive().default(10),
  PROVISIONER_CONTAINER_EXPIRY_MINUTES: z.coerce.number().positive().default(30),
  PROVISIONER_CONTAINER_IMAGE: z.string().default('ghcr.io/eistre/terminal-container:latest'),
});

export type BaseProvisionerSchema = z.infer<typeof baseProvisionerSchema>;
