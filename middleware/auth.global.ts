// template from https://v2.lucia-auth.com/guidebook/sign-in-with-username-and-password/nuxt/
export default defineNuxtRouteMiddleware(async () => {
  await fetchUser()
})
