import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const page = Math.max(1, parseInt((query.page as string) || "1", 10));
  const limit = Math.max(
    1,
    Math.min(100, parseInt((query.limit as string) || "20", 10)),
  );
  const search = (query.search as string) || "";
  const status = (query.status as string) || "";
  const sessionSearch = (query.session_id as string) || "";
  const dateFrom = (query.date_from as string) || "";
  const dateTo = (query.date_to as string) || "";

  const odoo = await getOdooClient(event);

  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("custom.order.api", "api_get_orders", [[], {
      page,
      limit,
      search_term: search || undefined,
      status: status || undefined,
      session_id: sessionSearch || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }]),
  );

  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل جلب الطلبات: ${rpcErr.message}`,
    });
  }

  return {
    success: true,
    data: result.data ?? [],
    totalItems: result.totalItems ?? 0,
    totalPages: result.totalPages ?? 0,
    currentPage: result.currentPage ?? page,
    itemsPerPage: result.itemsPerPage ?? limit,
  };
});
