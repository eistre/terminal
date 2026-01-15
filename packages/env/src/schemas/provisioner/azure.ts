import { z } from 'zod';
import { baseProvisionerSchema } from './base.js';

export const azureProvisionerSchema = baseProvisionerSchema.extend({
  PROVISIONER_TYPE: z.literal('azure'),

  PROVISIONER_AZURE_SUBSCRIPTION_ID: z.uuid(),
  PROVISIONER_AZURE_RESOURCE_GROUP: z.string().min(1),
  PROVISIONER_AZURE_LOCATION: z.string().min(1),
  PROVISIONER_AZURE_KEYVAULT_URL: z.url(),

  // ACI requires 0.1 increments for CPU (cores) and memory (GB)
  PROVISIONER_AZURE_CPU: z.coerce.number().multipleOf(0.1).min(0.1).default(0.1),
  PROVISIONER_AZURE_MEMORY_GB: z.coerce.number().multipleOf(0.1).min(0.1).default(0.1),
});

export type AzureProvisionerSchema = z.infer<typeof azureProvisionerSchema>;
