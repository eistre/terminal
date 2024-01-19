import type { ClusterStatus } from '~/kubernetes/azure'

export const useCluster = () => {
  return useState<ClusterStatus>('cluster', () => 'Stopped')
}
