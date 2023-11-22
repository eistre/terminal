// Builds docker image at startup
// https://github.com/apocas/dockerode
export default defineNitroPlugin(async () => {
  // TODO block client if no image available
  // TODO log 'Starting docker image build'

  try {
    const stream = await docker.buildImage(
      { context: '.', src: ['Dockerfile'] },
      { t: 'terminal/ubuntu' }
    )

    docker.modem.followProgress(
      stream,
      (error) => {
        if (error) {
          // TODO log error
        } else {
          // TODO log 'Docker image built successfully in time ms'
        }
      },
      (event) => {
        const data: string = event.stream

        if (/^Step \d+\/\d+ :/.test(data)) {
          // TODO log
        }
      }
    )
  } catch (error) {
    // TODO log error
  }
})
