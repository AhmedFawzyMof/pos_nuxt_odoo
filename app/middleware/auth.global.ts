import { getRequiredPermission } from '../types/permissions'
import type { PermissionCheck } from '../types/permissions'

export default defineNuxtRouteMiddleware((to) => {
  const userCookie = useCookie("auth_user")
  const hasValidUserCookie = !!userCookie.value

  if (!hasValidUserCookie && to.path !== "/login") {
    return navigateTo("/login")
  }

  if (hasValidUserCookie && to.path === "/login") {
    return navigateTo("/")
  }

  if (hasValidUserCookie && to.path !== "/login") {
    const permCheck: PermissionCheck | null = getRequiredPermission(to.path)
    if (permCheck) {
      const permissionsCookie = useCookie<any[]>("auth_permissions")
      const userPermissions: any[] = permissionsCookie.value || []
      const groupNames = userPermissions.flatMap((p: any) => {
        const name = typeof p === 'string' ? p : (p.fullName || p.name)
        return typeof p === 'object' && p.name ? [name, p.name] : [name]
      })

      const hasRequired = (groups?: string[]) => {
        if (!groups || groups.length === 0) return true
        return groups.every(g => groupNames.includes(g))
      }
      const hasAny = (groups?: string[]) => {
        if (!groups || groups.length === 0) return true
        return groups.some(g => groupNames.includes(g))
      }

      let allowed = true
      if (permCheck.require && permCheck.require.length > 0) {
        allowed = hasRequired(permCheck.require)
      } else if (permCheck.requireAny && permCheck.requireAny.length > 0) {
        allowed = hasAny(permCheck.requireAny)
      }

      if (!allowed) {
        return navigateTo("/")
      }
    }
  }
})
