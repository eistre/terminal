import Pino from 'pino'

const pino = Pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
})

export default pino
