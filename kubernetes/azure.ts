import { DefaultAzureCredential } from '@azure/identity'
import { ContainerServiceClient } from '@azure/arm-containerservice'
import emitter from '~/server/utils/emitter'

export type ClusterStatus = 'Running' | 'Starting' | 'Stopping' | 'Stopped'

const AZURE_SUBSCRIPTION = process.env.AZURE_SUBSCRIPTION || ''
const AZURE_RESOURCEGROUP = process.env.AZURE_RESOURCEGROUP || ''
const AZURE_CLUSTER = process.env.AZURE_CLUSTER || ''

const clusterLogger = pino.child({ caller: 'cluster' })

export class Azure {
  private client: ContainerServiceClient
  private clusterStatus: ClusterStatus

  constructor () {
    const credential = new DefaultAzureCredential()

    this.client = new ContainerServiceClient(credential, AZURE_SUBSCRIPTION || '')
    this.clusterStatus = 'Stopped'
  }

  getClusterStatus (): ClusterStatus {
    return this.clusterStatus
  }

  async setClusterStatus () {
    const cluster = await this.client.managedClusters.get(AZURE_RESOURCEGROUP, AZURE_CLUSTER)
    this.clusterStatus = cluster.powerState?.code as ClusterStatus
  }

  async startCluster () {
    this.clusterStatus = 'Starting'
    emitter.emit('clusterStatus', { status: this.clusterStatus })
    clusterLogger.debug('Starting cluster')

    await this.client.managedClusters.beginStartAndWait(AZURE_RESOURCEGROUP, AZURE_CLUSTER)

    this.clusterStatus = 'Running'
    emitter.emit('clusterStatus', { status: this.clusterStatus })
    clusterLogger.info('Cluster started')
  }

  async stopCluster () {
    this.clusterStatus = 'Stopping'
    emitter.emit('clusterStatus', { status: this.clusterStatus })
    clusterLogger.debug('Stopping cluster')

    await this.client.managedClusters.beginStopAndWait(AZURE_RESOURCEGROUP, AZURE_CLUSTER)

    this.clusterStatus = 'Stopped'
    emitter.emit('clusterStatus', { status: this.clusterStatus })
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
