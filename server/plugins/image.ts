// Builds docker image at startup
// https://github.com/apocas/dockerode
import { ImageEvent } from '~/server/utils/image'

export default defineNitroPlugin(async () => {
  const logger = pino.child({ caller: 'docker' })

  // TODO block client if no image available
  logger.info('Starting docker image build')
  const startTime = Date.now()

  try {
    const stream = await docker.buildImage(
      { context: '.', src: ['Dockerfile'] },
      { t: 'terminal/ubuntu' }
    )

    docker.modem.followProgress(
      stream,
      (error) => {
        if (error) {
          logger.error(error)
        } else {
          const executionTime = Date.now() - startTime
          logger.info(`Docker image built successfully in time ${executionTime} ms`)
        }
      },
      (event: ImageEvent) => {
        if (event.type === 'error') {
          // TODO retry
          logger.error(event)
        } else if (/^Step \d+\/\d+ :/.test(event.stream)) {
          logger.info(event.stream)
        }
      }
    )
  } catch (error) {
    logger.error(error)
  }
})
