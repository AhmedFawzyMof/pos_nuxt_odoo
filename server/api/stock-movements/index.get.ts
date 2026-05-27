import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  // 1. Gather filters and parameters directly from the client query
  const query = getQuery(event);
  const params = {
    page: Math.max(1, parseInt((query.page as string) || "1")),
    limit: Math.min(50, Math.max(1, parseInt((query.limit as string) || "8"))), // Matches your template's default (8)
    search: (query.search as string) || "",
    type: (query.type as string) || "all",
    dateFrom: (query.dateFrom as string) || "",
    dateTo: (query.dateTo as string) || "",
  };

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();
    console.log(params.type);
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
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في جلب حركات المخزون عبر النظام المخصص: ${error.message}`,
    });
  }
});
