import sshpk from 'sshpk';
import { z } from 'zod';

const defaultPrivateKey = sshpk.generatePrivateKey('ed25519');
const defaultPublicKey = defaultPrivateKey.toPublic();

export const baseProvisionerSchema = z.object({
  PROVISIONER_MAX_RETRIES: z.coerce.number().positive().default(3),
  PROVISIONER_CONCURRENCY_LIMIT: z.coerce.number().positive().default(10),
  PROVISIONER_CONTAINER_EXPIRY_MINUTES: z.coerce.number().positive().default(30),
  PROVISIONER_CONTAINER_IMAGE: z.string().default('ghcr.io/eistre/terminal-container:latest'),
  PROVISIONER_CONTAINER_MEMORY_REQUEST: z.string().default('64Mi'),
  PROVISIONER_CONTAINER_MEMORY_LIMIT: z.string().default('128Mi'),
  PROVISIONER_CONTAINER_CPU_REQUEST: z.string().default('100m'),
  PROVISIONER_CONTAINER_CPU_LIMIT: z.string().default('250m'),
  PROVISIONER_CONTAINER_SSH_PUBLIC_KEY: z.string().transform((val, ctx) => {
    const normalized = val.replaceAll(/\\n/g, '\n');

    try {
      return sshpk.parseKey(normalized, 'auto').toString('ssh');
    }
    catch {
      ctx.issues.push({
        code: 'custom',
        message: 'Invalid SSH public key format',
        input: undefined,
      });

      return z.NEVER;
    }
  }).default(defaultPublicKey.toString('ssh')),
  PROVISIONER_CONTAINER_SSH_PRIVATE_KEY: z.string().transform((val, ctx) => {
    const normalized = val.replaceAll(/\\n/g, '\n');

    try {
      return sshpk.parsePrivateKey(normalized, 'auto').toString('openssh');
    }
    catch {
      ctx.issues.push({
        code: 'custom',
        message: 'Invalid SSH private key format',
        input: undefined,
      });

      return z.NEVER;
    }
  }).default(defaultPrivateKey.toString('openssh')),
});

export type BaseProvisionerSchema = z.infer<typeof baseProvisionerSchema>;
