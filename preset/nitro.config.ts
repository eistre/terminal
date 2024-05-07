// template from https://github.com/sush1lemon/nuxt-socket.io/blob/main/preset/nitro.config.ts
import { fileURLToPath } from 'node:url'
import type { NitroPreset } from 'nitropack'

export default <NitroPreset>{
  extends: 'node',
  entry: fileURLToPath(new URL('./entry.ts', import.meta.url)),
  serveStatic: true,
  hooks: {
    compiled () {}
  },
  commands: {
    preview: 'node ./server/index.mjs'
  }
}
