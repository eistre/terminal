import Pino, { LoggerOptions } from 'pino'

function getPinoConfig (): LoggerOptions {
  if (process.env.NUXT_PUBLIC_RUNTIME !== 'CLOUD') {
    return {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    }
  }

  return {}
}

const pino = Pino(getPinoConfig())

export default pino
