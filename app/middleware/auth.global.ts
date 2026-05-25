import { useAuthStore } from "~~/stores/auth";

export default defineNuxtRouteMiddleware((to) => {
  const store = useAuthStore();

  const hasValidUserCookie = !!store.user;

  if (!hasValidUserCookie && to.path !== "/login") {
    return navigateTo("/login");
  }

  if (hasValidUserCookie && to.path === "/login") {
    return navigateTo("/");
  }
});
