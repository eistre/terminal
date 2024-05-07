// template from https://github.com/sush1lemon/nuxt-socket.io/blob/main/preset/entry.dev.ts
import '#internal/nitro/virtual/polyfill'
import { Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { parentPort, threadId } from 'node:worker_threads'
import { isWindows, provider } from 'std-env'
import { toNodeListener } from 'h3'
import { Server as SocketServer } from 'socket.io'
// @ts-ignore
import { trapUnhandledNodeErrors } from '#internal/nitro/utils'
import handleSocket from '~/socket/handler'

const nitroApp = useNitroApp()

const server = new Server(toNodeListener(nitroApp.h3App))

function getAddress () {
  if (
    provider === 'stackblitz' ||
    process.env.NITRO_NO_UNIX_SOCKET ||
    process.versions.bun
  ) {
    return 0
  }
  const socketName = `worker-${process.pid}-${threadId}.sock`
  if (isWindows) {
    return join('\\\\.\\pipe\\nitro', socketName)
  } else {
    const socketDir = join(tmpdir(), 'nitro')
    mkdirSync(socketDir, { recursive: true })
    return join(socketDir, socketName)
  }
}

const listenAddress = getAddress()
server.listen(listenAddress, () => {
  const _address = server.address()
  parentPort?.postMessage({
    event: 'listen',
    address:
      typeof _address === 'string'
        ? { socketPath: _address }
        : { host: 'localhost', port: _address?.port }
  })
})

const io = new SocketServer(server, { cors: { origin: '*' } })
handleSocket(io)
nitroApp.hooks.beforeEach((event) => {
  if (event.name === 'request' && event.args.length > 1) {
    // @ts-ignore
    event.args[1]._socket = io
  }
})

// Trap unhandled errors
trapUnhandledNodeErrors()

// Graceful shutdown
async function onShutdown () {
  await nitroApp.hooks.callHook('close')
}

parentPort?.on('message', async (msg) => {
  if (msg && msg.event === 'shutdown') {
    await onShutdown()
    parentPort?.postMessage({ event: 'exit' })
  }
})
