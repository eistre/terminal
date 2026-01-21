import { z } from 'zod';
import { baseProvisionerSchema } from './base.js';

export const awsProvisionerSchema = baseProvisionerSchema.extend({
  PROVISIONER_TYPE: z.literal('aws'),

  PROVISIONER_AWS_REGION: z.string().min(1),
  PROVISIONER_AWS_ECS_CLUSTER: z.string().min(1),
  PROVISIONER_AWS_TASK_FAMILY: z.string().min(1),
  PROVISIONER_AWS_SUBNETS: z.string().min(1),
  PROVISIONER_AWS_SECURITY_GROUPS: z.string().min(1),
  PROVISIONER_AWS_USE_PUBLIC_IP: z.stringbool().default(false),
});

export type AwsProvisionerSchema = z.infer<typeof awsProvisionerSchema>;
