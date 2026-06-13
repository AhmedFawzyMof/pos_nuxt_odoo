import { defineEventHandler, readBody, createError } from 'h3'
import { getOdooClient } from '~~/server/utils/odooClient'
import { requirePermission } from '~~/server/utils/permissions'
import { tryCatch } from '~~/server/utils/tryCatch'

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event)
  const session = await getUserSession(event)
  await requirePermission(event, 'Administration / Access Rights')

  const body = await readBody(event)

  if (!body.id) {
    throw createError({ statusCode: 400, message: 'User ID is required' })
  }

  const vals: any = {}
  if (body.name) vals.name = body.name
  if (body.email) vals.email = body.email
  if (body.login) vals.login = body.login
  if (body.password) vals.password = body.password
  if (body.active !== undefined) vals.active = body.active

  if (body.groups_id) {
    vals.groups_id = [[6, 0, body.groups_id.map(Number)]]
  }

  const [updateErr] = await tryCatch(odoo.execute_kw('res.users', 'write', [[[body.id], vals]]))
  if (updateErr) {
    throw createError({ statusCode: 500, message: updateErr.message || 'Failed to update user' })
  }

  // If updating own permissions, return refreshed permissions for the client store
  let refreshedPermissions: any[] | undefined
  if (session.user?.id === body.id && body.groups_id) {
    const [groupErr, groupRecords] = await tryCatch(
      odoo.execute_kw('res.groups', 'search_read', [
        [['id', 'in', body.groups_id.map(Number)]],
        { fields: ['id', 'name', 'full_name', 'category_id'] },
      ])
    )
    if (!groupErr && groupRecords) {
      refreshedPermissions = groupRecords.map((g: any) => ({
        id: g.id,
        name: g.name,
        fullName: g.full_name || `${g.category_id?.[1] || ''} / ${g.name}`,
      }))
    }
  }

  return { success: true, permissions: refreshedPermissions }
})
