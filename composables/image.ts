export const useImageReady = () => {
  return useState<boolean>('image', () => false)
}
