import { defineEventHandler, readBody, createError } from 'h3'
import { getOdooClient } from '~~/server/utils/odooClient'
import { requirePermission } from '~~/server/utils/permissions'
import { tryCatch } from '~~/server/utils/tryCatch'

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event)
  const session = await getUserSession(event)
  await requirePermission(event, 'Administration / Access Rights')

  const body = await readBody(event)

  if (!body.name || !body.login || !body.password) {
    throw createError({ statusCode: 400, message: 'Name, login, and password are required' })
  }

  const vals: any = {
    name: body.name,
    login: body.login,
    password: body.password,
    email: body.email || body.login,
    active: body.active !== false,
  }

  if (session.currentCompanyId) {
    vals.company_id = session.currentCompanyId
    vals.company_ids = [[6, 0, [session.currentCompanyId]]]
  }

  if (body.groups_id && body.groups_id.length > 0) {
    vals.groups_id = [[6, 0, body.groups_id.map(Number)]]
  }

  const [createErr, newId] = await tryCatch(odoo.execute_kw('res.users', 'create', [[vals]]))
  if (createErr) {
    throw createError({ statusCode: 500, message: createErr.message || 'Failed to create user' })
  }

  return { success: true, id: newId }
})
