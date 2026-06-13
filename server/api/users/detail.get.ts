import { defineEventHandler, createError } from 'h3'
import { getOdooClient } from '~~/server/utils/odooClient'
import { requirePermission } from '~~/server/utils/permissions'
import { tryCatch } from '~~/server/utils/tryCatch'

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event)
  await requirePermission(event, 'Administration / Access Rights')

  const query = getQuery(event)
  const userId = Number(query.id)
  if (!userId) {
    throw createError({ statusCode: 400, message: 'User ID is required' })
  }

  const [userErr, users] = await tryCatch(
    odoo.read('res.users', [userId], ['id', 'name', 'login', 'email', 'active', 'groups_id', 'company_id'])
  )
  if (userErr || !users || users.length === 0) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const ud = users as Array<{ groups_id?: number[]; groups?: any[] }>
  const user = ud[0]
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }
  const rawGroupIds = user.groups_id || []
  const groupIds = rawGroupIds.map((g: any) => (Array.isArray(g) ? g[0] : g))

  const groupDomain = [['id', 'in', groupIds]]
  const [groupErr, groups] = await tryCatch(
    odoo.execute_kw('res.groups', 'search_read', [
      [groupDomain],
      { fields: ['id', 'name', 'full_name', 'category_id', 'share'] },
    ])
  )
  if (!groupErr && groups) {
    user.groups = groups
  } else {
    user.groups = []
  }
  delete (user as any).groups_id

  return { success: true, data: user }
})
