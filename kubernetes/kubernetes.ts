// snippets from https://github.com/kubernetes-client/javascript
import * as k8s from '@kubernetes/client-node'
import dayjs from 'dayjs'
import forge from 'node-forge'
import { parse } from 'yaml'

const POD_DATE_VALUE: number = Number(process.env.POD_DATE_VALUE) || 1
const POD_DATE_UNIT: dayjs.ManipulateType = process.env.POD_DATE_UNIT as dayjs.ManipulateType || 'day'
const KUBE_CONFIG = process.env.KUBE_CONFIG

export class Kubernetes {
  private api: k8s.CoreV1Api
  private watch: k8s.Watch

  constructor () {
    const kc = new k8s.KubeConfig()

    if (KUBE_CONFIG) {
      kc.loadFromString(Buffer.from(KUBE_CONFIG, 'base64').toString())
    } else {
      kc.loadFromDefault()
    }

    this.api = kc.makeApiClient(k8s.CoreV1Api)
    this.watch = new k8s.Watch(kc)
  }

  async createOrUpdatePod (clientId: string): Promise<{ ip: string, port: number }> {
    const namespace = `ubuntu-${clientId}`
    const namespaceExists = await this.doesNamespaceExist(namespace)

    if (namespaceExists) {
      await this.updatePod(namespace)
    } else {
      await this.createPod(namespace)

      // Wait for pod to create
      await new Promise<void>((resolve, reject) => {
        const watch = async () => {
          try {
            const req = await this.watch.watch(
              `/api/v1/namespaces/${namespace}/pods`,
              {},
              (type, apiObj) => {
                if (type === 'MODIFIED' && apiObj.metadata.name === 'ubuntu' && apiObj.status.phase === 'Running') {
                  req.abort()
                  resolve()
                }
              },
              (error) => {
                req.abort()
                reject(error)
              }
            )
          } catch (error) {
            reject(error)
          }
        }

        watch()
      })

      // Wait for pod to start
      await new Promise((resolve) => {
        setTimeout(resolve, 3000)
      })
    }

    return this.getConnectionDetails(clientId)
  }

  async deleteNamespace (namespace: string) {
    await this.api.deleteNamespace(namespace)
    await useStorage('ssh').removeItem(namespace)
  }

  async getNamespaces (): Promise<k8s.V1Namespace[]> {
    const namespaces = await this.api.listNamespace()
    return namespaces.body.items.filter(namespace => namespace.metadata?.name?.startsWith('ubuntu-'))
  }

  private async doesNamespaceExist (name: string): Promise<boolean> {
    const namespace = (await this.getNamespaces())
      .find(k8sNamespace => k8sNamespace.metadata?.name === name)

    if (!namespace) {
      return false
    }

    if (namespace.metadata?.deletionTimestamp) {
      // Wait for namespace to terminate
      await new Promise<void>((resolve, reject) => {
        const watch = async () => {
          try {
            const req = await this.watch.watch(
              '/api/v1/namespaces',
              {},
              (type, apiObj) => {
                if (type === 'DELETED' && apiObj.metadata.name === name) {
                  req.abort()
                  resolve()
                }
              },
              (error) => {
                req.abort()
                reject(error)
              }
            )
          } catch (error) {
            reject(error)
          }
        }

        watch()
      })

      return false
    }

    return true
  }

  private async createPod (namespace: string) {
    // Read namespace spec
    const secretYaml = await useStorage('k8s').getItem<string>('secret.yaml')
    const podYaml = await useStorage('k8s').getItem<string>('pod.yaml')
    const serviceYaml = await useStorage('k8s').getItem<string>('service.yaml')

    if (!secretYaml || !podYaml || !serviceYaml) {
      throw new Error('Namespace spec not found')
    }

    // Parse namespace spec
    const secret = parse(secretYaml)
    const pod = parse(podYaml)
    const service = parse(serviceYaml)

    // Create namespace
    await this.api.createNamespace({
      metadata: {
        name: namespace,
        annotations: {
          expireTime: getExpireDateTime(POD_DATE_VALUE, POD_DATE_UNIT)
        }
      }
    })

    // Create ssh keys
    const { publicKey, privateKey } = forge.pki.rsa.generateKeyPair({ bits: 2048 })

    secret.data.id_rsa = Buffer.from(forge.ssh.publicKeyToOpenSSH(publicKey)).toString('base64')
    await useStorage('ssh').setItem<string>(namespace, forge.ssh.privateKeyToOpenSSH(privateKey))

    await this.api.createNamespacedSecret(namespace, secret)

    // Create pod
    await this.api.createNamespacedPod(namespace, pod)

    // Create service for ssh
    await this.api.createNamespacedService(namespace, service)
  }

  private async updatePod (namespace: string) {
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

  private async getConnectionDetails (clientId: string): Promise<{ ip: string, port: number }> {
    const namespace = `ubuntu-${clientId}`

    const pod = (await this.api.listNamespacedPod(namespace)).body.items
      .find(item => item.metadata?.name === 'ubuntu')

    const service = (await this.api.listNamespacedService(namespace)).body.items
      .find(item => item.metadata?.name === 'ssh')

    const node = (await this.api.listNode()).body.items
      .find(item => item.metadata?.name === pod?.spec?.nodeName)

    if (!pod) {
      throw new Error(`Pod not found for client: ${clientId}`)
    } else if (!service) {
      throw new Error(`Service not found for client: ${clientId}`)
    } else if (!node) {
      throw new Error(`Node not found for client: ${clientId}`)
    }

    const ip = this.getIp(node)

    const port = service.spec?.ports
      ?.find(port => port.name === 'ssh')
      ?.nodePort

    if (!port) {
      throw new Error('Pod ip or port not found')
    }

    return {
      ip,
      port
    }
  }

  private getIp (node: k8s.V1Node) {
    const type = process.env.NUXT_PUBLIC_RUNTIME === 'CLOUD' ? 'ExternalIP' : 'InternalIP'

    if (node.status?.nodeInfo?.containerRuntimeVersion.startsWith('docker:')) {
      return 'localhost'
    }

    return node.status?.addresses?.find(item => item.type === type)?.address || 'localhost'
  }
}
