import Pino from 'pino'
import pretty from 'pino-pretty'

const stream = pretty({
  colorize: process.env.LOG_COLORIZE === 'TRUE'
})

const pino = Pino(
  { level: process.env.NODE_ENV === 'development' ? 'debug' : 'info' },
  stream
)

export default pino
