// https://github.com/sush1lemon/nuxt-socket.io/blob/main/preset/entry.ts
import '#internal/nitro/virtual/polyfill'
import { Server as HttpServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Server as HttpsServer } from 'node:https'
// eslint-disable-next-line import/no-named-as-default
import destr from 'destr'
import { toNodeListener } from 'h3'
import { Server as SocketServer } from 'socket.io'
// @ts-ignore
import { trapUnhandledNodeErrors } from '#internal/nitro/utils'
// @ts-ignore
import { setupGracefulShutdown } from '#internal/nitro/shutdown'
import handleSocket from '~/socket/handler'

const nitroApp = useNitroApp()

const cert = process.env.NITRO_SSL_CERT
const key = process.env.NITRO_SSL_KEY

const server =
  cert && key
    ? new HttpsServer({ key, cert }, toNodeListener(nitroApp.h3App))
    : new HttpServer(toNodeListener(nitroApp.h3App))

const port = (destr(process.env.NITRO_PORT || process.env.PORT) || 3000)
const host = process.env.NITRO_HOST || process.env.HOST

const path = process.env.NITRO_UNIX_SOCKET

// @ts-ignore
const listener = server.listen(path ? { path } : { port, host }, (err) => {
  if (err) {
    console.error(err)

    process.exit(1)
  }
  const protocol = cert && key ? 'https' : 'http'
  const addressInfo = listener.address() as AddressInfo

  const baseURL = (useRuntimeConfig().app.baseURL || '').replace(/\/$/, '')
  const url = `${protocol}://${
    addressInfo.family === 'IPv6'
      ? `[${addressInfo.address}]`
      : addressInfo.address
  }:${addressInfo.port}${baseURL}`
  console.log(`Listening on ${url}`)
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
setupGracefulShutdown(listener, nitroApp)

export default {}
