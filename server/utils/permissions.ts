import { createError, getCookie } from 'h3'

function checkGroup(event: any, groupIdOrName: string): boolean {
  const raw = getCookie(event, 'auth_permissions')
  if (!raw) return false
  try {
    const permissions = JSON.parse(raw)
    return permissions.some((p: any) => p.fullName === groupIdOrName || p.name === groupIdOrName)
  } catch {
    return false
  }
}

export async function requirePermission(event: any, requiredGroup: string): Promise<void> {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!checkGroup(event, requiredGroup)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: insufficient permissions' })
  }
}

export async function requireAnyPermission(event: any, requiredGroups: string[]): Promise<void> {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  for (const g of requiredGroups) {
    if (checkGroup(event, g)) return
  }
  throw createError({ statusCode: 403, statusMessage: 'Forbidden: insufficient permissions' })
}
