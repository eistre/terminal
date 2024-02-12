import Pino from 'pino'

const pino = Pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: process.env.LOG_PRETTY === 'TRUE'
    }
  }
})

export default pino
