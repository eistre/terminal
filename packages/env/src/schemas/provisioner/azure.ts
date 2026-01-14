import { z } from 'zod';
import { baseProvisionerSchema } from './base.js';

export const azureProvisionerSchema = baseProvisionerSchema.extend({
  PROVISIONER_TYPE: z.literal('azure'),

  // Azure subscription and resource configuration
  PROVISIONER_AZURE_SUBSCRIPTION_ID: z.uuid(),
  PROVISIONER_AZURE_RESOURCE_GROUP: z.string().min(1),
  PROVISIONER_AZURE_LOCATION: z.string().min(1),

  // Networking - subnet for ACI containers (full resource ID)
  PROVISIONER_AZURE_SUBNET_ID: z.string().min(1),

  // Cosmos DB configuration for SSH keys (NoSQL API, serverless)
  PROVISIONER_AZURE_COSMOS_ENDPOINT: z.url(),
  PROVISIONER_AZURE_COSMOS_DATABASE: z.string().default('terminal'),
  PROVISIONER_AZURE_COSMOS_CONTAINER: z.string().default('ssh-keys'),

  // Authentication - Managed Identity (default) or Service Principal
  PROVISIONER_AZURE_USE_MANAGED_IDENTITY: z.coerce.boolean().default(true),

  // Service Principal credentials (required when USE_MANAGED_IDENTITY is false)
  PROVISIONER_AZURE_TENANT_ID: z.uuid().optional(),
  PROVISIONER_AZURE_CLIENT_ID: z.uuid().optional(),
  PROVISIONER_AZURE_CLIENT_SECRET: z.string().optional(),
}).refine((data) => {
  if (data.PROVISIONER_AZURE_USE_MANAGED_IDENTITY) {
    return true;
  }

  // Service Principal: all 3 fields required
  return data.PROVISIONER_AZURE_TENANT_ID !== undefined
    && data.PROVISIONER_AZURE_CLIENT_ID !== undefined
    && data.PROVISIONER_AZURE_CLIENT_SECRET !== undefined;
}, {
  error: 'Service Principal credentials (TENANT_ID, CLIENT_ID, CLIENT_SECRET) are required when USE_MANAGED_IDENTITY is false',
});

export type AzureProvisionerSchema = z.infer<typeof azureProvisionerSchema>;
