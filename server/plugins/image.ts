export default defineNitroPlugin(async () => {
  socket.on('connection', async (socket) => {
    socket.emit('image', { status: docker.isImageReady })
  })
})
