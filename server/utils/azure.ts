// Used as a template:
// https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
import { Azure } from '~/kubernetes/azure'

const azureClientSingleton = () => {
  return new Azure()
}

type AzureClientSingleton = ReturnType<typeof azureClientSingleton>

const globalForAzure = globalThis as unknown as {
  azure: AzureClientSingleton | undefined
}

const azure = globalForAzure.azure ?? azureClientSingleton()

export default azure

if (process.env.NODE_ENV !== 'production') { globalForAzure.azure = azure }
