// template from https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
import { Kubernetes } from '~/kubernetes/kubernetes'

const kubernetesClientSingleton = () => {
  return new Kubernetes()
}

type KubernetesClientSingleton = ReturnType<typeof kubernetesClientSingleton>

const globalForKubernetes = globalThis as unknown as {
    kubernetes: KubernetesClientSingleton | undefined
}

const kubernetes = globalForKubernetes.kubernetes ?? kubernetesClientSingleton()

export default kubernetes

if (process.env.NODE_ENV !== 'production') { globalForKubernetes.kubernetes = kubernetes }
