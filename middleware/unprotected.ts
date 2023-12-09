// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
export default defineNuxtRouteMiddleware(() => {
  const user = useUser()
  if (user.value) {
    return navigateTo('/exercises')
  }
})
