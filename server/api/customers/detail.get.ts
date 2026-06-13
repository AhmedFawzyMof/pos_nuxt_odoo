// server/api/customer-details.get.ts
import { defineEventHandler, getQuery, createError } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const customerId = query.id as string;

  if (!customerId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing customer id",
    });
  }

  const odoo = await getOdooClient(event);
  await requirePermission(event, 'Point of Sale / User')

  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("res.partner", "get_customer_detailed_ledger", [
      [],
      { params: { customer_id: customerId } },
    ]),
  );

  if (rpcErr) throw rpcErr;
  return result;
});
