export default defineNuxtRouteMiddleware(() => {
  const user = useUser()

  if (user.value?.role !== 'ADMIN') {
    return navigateTo('/')
  }
})
