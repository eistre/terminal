// template from https://v2.lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
export default defineNuxtRouteMiddleware(() => {
  const user = useUser()
  if (!user.value || user.value?.role === 'UNVERIFIED') {
    return navigateTo('/')
  }
})
