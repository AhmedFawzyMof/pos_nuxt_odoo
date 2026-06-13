import { defineEventHandler, readBody, createError } from 'h3'
import { getOdooClient } from '~~/server/utils/odooClient'
import { requirePermission } from '~~/server/utils/permissions'
import { tryCatch } from '~~/server/utils/tryCatch'

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event)
  await requirePermission(event, 'Administration / Access Rights')

  const body = await readBody(event)
  if (!body.id) {
    throw createError({ statusCode: 400, message: 'User ID is required' })
  }

  const [deactivateErr] = await tryCatch(
    odoo.execute_kw('res.users', 'write', [[[body.id], { active: false }]])
  )
  if (deactivateErr) {
    throw createError({ statusCode: 500, message: deactivateErr.message || 'Failed to deactivate user' })
  }

  return { success: true, message: 'User deactivated' }
})
