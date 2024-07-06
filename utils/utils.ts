import { io } from 'socket.io-client'
import type { ClusterStatus } from '~/kubernetes/azure'

export const fetchUser = async () => {
  const user = useUser()

  const { data, error } = await useFetch('/api/auth/user')

  if (error.value) {
    throw createError('Failed to fetch user data')
  }

  user.value = data.value?.user ?? null
}

export const createSocket = () => {
  const socket = useSocket()
  const cluster = useCluster()

  socket.value = io()

  socket.value.on('clusterStatus', ({ status }: { status: ClusterStatus }) => {
    cluster.value = status
  })
}
