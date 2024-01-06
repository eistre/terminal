// Used as a template:
// https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
import Docker from 'dockerode'

const dockerClientSingleton = () => {
  if (process.env.RUNTIME === 'CLOUD') {
    return {
      isImageReady: true,
      docker: new Docker()
    }
  }

  return {
    isImageReady: false,
    docker: new Docker()
  }
}

type DockerClientSingleton = ReturnType<typeof dockerClientSingleton>

const globalForDocker = globalThis as unknown as {
    docker: DockerClientSingleton | undefined
}

const docker = globalForDocker.docker ?? dockerClientSingleton()

export default docker

if (process.env.NODE_ENV !== 'production') { globalForDocker.docker = docker }
