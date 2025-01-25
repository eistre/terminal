import { io } from 'socket.io-client'
import type { ClusterStatus } from '~/kubernetes/azure'

export const fetchUser = async () => {
  const user = useUser()

  try {
    const data = await $fetch('/api/auth/user')
    user.value = data?.user ?? null
  } catch (error) {
    throw createError('Failed to fetch user data')
  }
}

export const createSocket = () => {
  const socket = useStatusSocket()
  const cluster = useCluster()

  socket.value = io()

  socket.value.on('clusterStatus', ({ status }: { status: ClusterStatus }) => {
    cluster.value = status
  })
}
