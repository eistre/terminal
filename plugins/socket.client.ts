import { io } from 'socket.io-client'
import type { ClusterStatus } from '~/kubernetes/azure'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const isCloud = config.public.runtime === 'CLOUD'

  if (!isCloud) {
    return
  }

  const cluster = useCluster()
  const socket = io()

  socket.on('clusterStatus', ({ status }: { status: ClusterStatus }) => {
    cluster.value = status
  })
})
