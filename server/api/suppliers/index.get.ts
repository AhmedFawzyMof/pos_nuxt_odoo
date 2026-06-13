import { defineEventHandler, getQuery, createError } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const paramsPayload = {
    page: (query.page as string) || "1",
    search: (query.search as string) || "",
    status: (query.status as string) || "all",
  };

  const odoo = await getOdooClient(event);
  await requirePermission(event, 'Purchase / User')
  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("res.partner", "get_pos_suppliers", [[paramsPayload]]),
  );
  if (rpcErr) throw rpcErr;
  return result;
});
