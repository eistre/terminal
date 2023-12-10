// https://github.com/kubernetes-client/javascript
import * as k8s from '@kubernetes/client-node'
import dayjs from 'dayjs'
import forge from 'node-forge'
import { parse } from 'yaml'

const POD_DATE_VALUE: number = Number(process.env.POD_DATE_VALUE) || 1
const POD_DATE_UNIT: dayjs.ManipulateType = process.env.POD_DATE_UNIT as dayjs.ManipulateType || 'day'

export class Kubernetes {
  private api: k8s.CoreV1Api

  constructor () {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()

    this.api = kc.makeApiClient(k8s.CoreV1Api)
  }

  async createOrUpdatePod (clientId: string) {
    const namespace = `ubuntu-${clientId}`
    const namespaceExists = await this.doesNamespaceExist(namespace)

    if (namespaceExists) {
      await this.updatePod(namespace)
    } else {
      await this.createPod(namespace)
    }

    // Wait for pod to start
    await new Promise((resolve) => {
      setTimeout(resolve, 3000)
    })
  }

  async getPort (clientId: string): Promise<number> {
    const namespace = `ubuntu-${clientId}`
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
    await useStorage('ssh').removeItem(namespace)
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
}