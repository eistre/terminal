// snippets from https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/containerservice/arm-containerservice
import { DefaultAzureCredential } from '@azure/identity'
import { ContainerServiceClient } from '@azure/arm-containerservice'
import { Cron } from 'croner'
import dayjs from 'dayjs'
import emitter from '~/server/utils/emitter'

export type ClusterStatus = 'Running' | 'Starting' | 'Stopping' | 'Stopped'
type ProvisioningState = 'Starting' | 'Stopping' | 'Succeeded'
type PowerState = 'Running' | 'Stopped'

const AZURE_SUBSCRIPTION = process.env.AZURE_SUBSCRIPTION || ''
const AZURE_RESOURCEGROUP = process.env.AZURE_RESOURCEGROUP || ''
const AZURE_CLUSTER = process.env.AZURE_CLUSTER || ''

const clusterLogger = pino.child({ caller: 'cluster' })

export class Azure {
  private client: ContainerServiceClient
  private clusterStatus: ClusterStatus
  private stopLock: boolean

  constructor () {
    const credential = new DefaultAzureCredential()

    this.client = new ContainerServiceClient(credential, AZURE_SUBSCRIPTION || '')
    this.clusterStatus = 'Stopped'
    this.stopLock = true

    new Cron(dayjs().add(5, 'minutes').toDate(), () => {
      this.stopLock = false
    })
  }

  getClusterStatus (): ClusterStatus {
    return this.clusterStatus
  }

  async setClusterStatus () {
    const cluster = await this.client.managedClusters.get(AZURE_RESOURCEGROUP, AZURE_CLUSTER)
    const provisioningState: ProvisioningState = cluster.provisioningState as ProvisioningState
    const powerState: PowerState = cluster.powerState?.code as PowerState

    this.clusterStatus = provisioningState === 'Succeeded' ? powerState : provisioningState
  }

  getStopLock (): boolean {
    return this.stopLock
  }

  async startCluster () {
    this.clusterStatus = 'Starting'
    emitter.emit('clusterStatus')
    clusterLogger.debug('Starting cluster')

    await this.client.managedClusters.beginStartAndWait(AZURE_RESOURCEGROUP, AZURE_CLUSTER)

    this.stopLock = true
    new Cron(dayjs().add(30, 'minutes').toDate(), () => {
      this.stopLock = false
    })

    this.clusterStatus = 'Running'
    emitter.emit('clusterStatus')
    clusterLogger.info('Cluster started')
  }

  async stopCluster () {
    this.clusterStatus = 'Stopping'
    emitter.emit('clusterStatus')
    clusterLogger.debug('Stopping cluster')

    await this.client.managedClusters.beginStopAndWait(AZURE_RESOURCEGROUP, AZURE_CLUSTER)

    this.clusterStatus = 'Stopped'
    emitter.emit('clusterStatus')
    clusterLogger.info('Cluster stopped')
  }

  waitForClusterStatus (status: ClusterStatus) {
    return new Promise<void>((resolve) => {
      if (this.clusterStatus === status) {
        resolve()
      }

      const listener = () => {
        if (this.clusterStatus === status) {
          resolve()
          emitter.off('clusterStatus', listener)
        }
      }

      emitter.on('clusterStatus', listener)
    })
  }
}
