import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { ActionPermissions, PagePermissions, Pages, Groups, type ActionKey } from '../types/permissions'

export const usePermissions = () => {
  const auth = useAuthStore()

  const userPermissions = computed(() => auth.permissions || [])

  function hasPermission(groupFullName: string): boolean {
    if (!groupFullName) return true
    return userPermissions.value.some((p: any) => {
      const val = typeof p === 'string' ? p : (p.fullName || p.name)
      return val === groupFullName || (typeof p === 'object' && p.name === groupFullName)
    })
  }

  function hasAnyPermission(groups: string[]): boolean {
    if (!groups || groups.length === 0) return true
    return groups.some(g => hasPermission(g))
  }

  function hasAllPermissions(groups: string[]): boolean {
    if (!groups || groups.length === 0) return true
    return groups.every(g => hasPermission(g))
  }

  const can = computed(() => {
    function check(action: ActionKey): boolean {
      const perm = ActionPermissions[action]
      if (!perm) return false
      if (perm.require && perm.require.length > 0) {
        return hasAllPermissions(perm.require)
      }
      if (perm.requireAny && perm.requireAny.length > 0) {
        return hasAnyPermission(perm.requireAny)
      }
      return true
    }
    return check
  })

  function canViewPage(path: string): boolean {
    const perm = PagePermissions[path]
    if (perm) {
      if (perm.require && perm.require.length > 0) return hasAllPermissions(perm.require)
      if (perm.requireAny && perm.requireAny.length > 0) return hasAnyPermission(perm.requireAny)
      return true
    }
    const page = Pages.find(p => p.routes.includes(path))
    if (page) {
      return hasPermission(Groups[page.levels[0].groupRef])
    }
    return true
  }

  const isManager = computed(() => hasPermission('Point of Sale / Administrator'))
  const isPosUser = computed(() => hasPermission('Point of Sale / User'))
  const isPurchaseUser = computed(() => hasPermission('Purchase / User'))
  const isStockUser = computed(() => hasPermission('Inventory / User'))
  const isAccountUser = computed(() => hasPermission('Accounting / Invoicing'))

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    canViewPage,
    isManager,
    isPosUser,
    isPurchaseUser,
    isStockUser,
    isAccountUser,
  }
}
