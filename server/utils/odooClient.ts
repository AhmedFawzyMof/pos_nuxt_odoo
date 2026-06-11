import { createError } from "h3"
import { connectToOdoo } from "./client"
import { tryCatch } from "./tryCatch"

export async function getOdooClient(event: any) {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
  }
  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
    session.currentCompanyId as number | undefined,
  )
  const [connectErr] = await tryCatch(odoo.connect())
  if (connectErr) {
    throw createError({
      statusCode: 500,
      message: `Failed to connect to server: ${connectErr.message}`,
    })
  }
  return odoo
}
