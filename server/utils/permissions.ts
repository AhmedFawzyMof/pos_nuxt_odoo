import { createError } from 'h3'

function checkRole(event: any, requiredRole: string): boolean {
  const session = event.session || (event as any)._session
  return session?.user?.roles?.includes(requiredRole) ?? false
}

export async function requirePermission(event: any, requiredRole: string): Promise<void> {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!session.user.roles?.includes(requiredRole)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: insufficient permissions' })
  }
}

export async function requireAnyPermission(event: any, requiredRoles: string[]): Promise<void> {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!requiredRoles.some(r => session.user.roles?.includes(r))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: insufficient permissions' })
  }
}
