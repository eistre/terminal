import sshpk from 'sshpk';
import { z } from 'zod';

export const baseProvisionerSchema = z.object({
  PROVISIONER_MAX_RETRIES: z.coerce.number().positive().default(3),
  PROVISIONER_CONCURRENCY_LIMIT: z.coerce.number().positive().default(10),
  PROVISIONER_CONTAINER_TTL_MINUTES: z.coerce.number().positive().default(30),
  PROVISIONER_CONTAINER_IMAGE: z.string().default('ubuntu:24.04'),
  PROVISIONER_CONTAINER_MEMORY_REQUEST: z.string().default('64Mi'),
  PROVISIONER_CONTAINER_MEMORY_LIMIT: z.string().default('128Mi'),
  PROVISIONER_CONTAINER_CPU_REQUEST: z.string().default('100m'),
  PROVISIONER_CONTAINER_CPU_LIMIT: z.string().default('250m'),
  PROVISIONER_CONTAINER_SSH_PUBLIC_KEY: z.string().transform((val, ctx) => {
    const normalized = val.replace(/\\n/, '\n');

    try {
      return sshpk.parseKey(normalized, 'auto').toString('ssh');
    }
    catch {
      ctx.issues.push({
        code: 'custom',
        message: 'Invalid SSH public key format',
        input: val,
      });

      return z.NEVER;
    }
  }),
  PROVISIONER_CONTAINER_SSH_PRIVATE_KEY: z.string().transform((val, ctx) => {
    const normalized = val.replace(/\\n/, '\n');

    try {
      return sshpk.parsePrivateKey(normalized, 'auto').toString('openssh');
    }
    catch {
      ctx.issues.push({
        code: 'custom',
        message: 'Invalid SSH private key format',
        input: val,
      });

      return z.NEVER;
    }
  }),
});

export type BaseProvisionerSchema = z.infer<typeof baseProvisionerSchema>;
