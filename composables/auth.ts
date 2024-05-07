// template from https://v2.lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
import type { User } from 'lucia'

export const useUser = () => {
  return useState<User | null>('user', () => null)
}
