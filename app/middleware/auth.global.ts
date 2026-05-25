export default defineNuxtRouteMiddleware((to) => {
  const userCookie = useCookie("auth_user");
  const hasValidUserCookie = !!userCookie.value;

  if (!hasValidUserCookie && to.path !== "/login") {
    return navigateTo("/login");
  }

  if (hasValidUserCookie && to.path === "/login") {
    return navigateTo("/");
  }
});
