import { defineEventHandler, getQuery, createError } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const params = {
    page: Math.max(1, parseInt((query.page as string) || "1")),
    limit: Math.min(50, Math.max(1, parseInt((query.limit as string) || "8"))), // Matches your template's default (8)
    search: (query.search as string) || "",
    type: (query.type as string) || "all",
    dateFrom: (query.dateFrom as string) || "",
    dateTo: (query.dateTo as string) || "",
  };

  const odoo = await getOdooClient(event);
  await requirePermission(event, 'stock_user')
  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("stock.move.line", "get_frontend_ledger", [
      [],
      { params: params },
    ]),
  );

  if (rpcErr) {
    throw rpcErr;
  }

  return result;
});
