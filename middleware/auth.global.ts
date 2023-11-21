// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
export default defineNuxtRouteMiddleware(async () => {
  const user = useUser()

  const { data, error } = await useFetch('/api/auth/user')

  if (error.value) {
    throw createError('Failed to fetch user data')
  }

  user.value = data.value?.user ?? null
})
