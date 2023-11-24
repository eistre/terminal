type ImageStream = {
  type: 'stream'
  stream: string
}

type ImageError = {
  type: 'error'
  error: string
  errorDetails: {
    code: number
    message: string
  }
}

export type ImageEvent = ImageStream | ImageError
