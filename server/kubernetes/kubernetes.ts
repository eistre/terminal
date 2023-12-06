// https://github.com/kubernetes-client/javascript
import * as k8s from '@kubernetes/client-node'
import dayjs from 'dayjs'

const POD_DATE_VALUE: number = Number(process.env.POD_DATE_VALUE) || 1
const POD_DATE_UNIT: dayjs.ManipulateType = process.env.POD_DATE_UNIT as dayjs.ManipulateType || 'day'

export class Kubernetes {
  private api: k8s.CoreV1Api

  constructor () {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()

    this.api = kc.makeApiClient(k8s.CoreV1Api)
  }

  async createOrUpdateDeployment (namespace: string) {
    const namespaceExists = await this.doesNamespaceExist(namespace)

    if (namespaceExists) {
      await this.updateDeployment(namespace)
    } else {
      await this.createDeployment(namespace)
    }

    // Wait for pod to start
    await new Promise((resolve) => {
      setTimeout(resolve, 3000)
    })
  }

  async getPort (namespace: string): Promise<number> {
    const service = (await this.api.listNamespacedService(namespace))
      .body
      .items
      .find(item => item.metadata?.name === 'ssh')

    if (!service) {
      throw new Error('Pod service not found')
    }

    const port = service.spec?.ports?.find(port => port.name === 'ssh')

    if (!port?.nodePort) {
      throw new Error('Pod port not found')
    }

    return port.nodePort
  }

  async deleteNamespace (namespace: string) {
    await this.api.deleteNamespace(namespace)
  }

  async getNamespaces (): Promise<k8s.V1Namespace[]> {
    const namespaces = await this.api.listNamespace()
    return namespaces.body.items.filter(namespace => namespace.metadata?.name?.startsWith('ubuntu-'))
  }

  // TODO what if namespace is terminating
  private async doesNamespaceExist (namespace: string): Promise<boolean> {
    const namespaces = await this.getNamespaces()
    return namespaces.some(k8sNamespace => k8sNamespace.metadata?.name === namespace)
  }

  private async createDeployment (namespace: string) {
    // Create namespace
    await this.api.createNamespace({
      metadata: {
        name: namespace,
        annotations: {
          expireTime: getExpireDateTime(POD_DATE_VALUE, POD_DATE_UNIT)
        }
      }
    })

    // Create pod
    await this.api.createNamespacedPod(namespace, {
      metadata: {
        name: 'ubuntu',
        labels: {
          app: 'ubuntu'
        }
      },
      spec: {
        containers: [{
          name: 'ubuntu',
          image: 'terminal/ubuntu',
          imagePullPolicy: 'Never'
        }]
      }
    })

    // Create service for ssh
    await this.api.createNamespacedService(namespace, {
      metadata: {
        name: 'ssh'
      },
      spec: {
        type: 'NodePort',
        selector: {
          app: 'ubuntu'
        },
        ports: [{
          name: 'ssh',
          port: 22,
          targetPort: 22
        }]
      }
    })
  }

  private async updateDeployment (namespace: string) {
    await this.api.patchNamespace(
      namespace,
      [{
        op: 'replace',
        path: '/metadata/annotations',
        value: { expireTime: getExpireDateTime(POD_DATE_VALUE, POD_DATE_UNIT) }
      }],
      undefined, // pretty
      undefined, // dryRun
      undefined, // fieldManager
      undefined, // fieldValidation
      undefined, // force
      { headers: { 'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH } }
    )
  }
}
