import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const query = getQuery(event);
  const paramsPayload = {
    page: (query.page as string) || "1",
    limit: (query.limit as string) || "20",
    search: (query.search as string) || "",
    state: (query.state as string) || "",
    date_from: (query.date_from as string) || "",
    date_to: (query.date_to as string) || "",
    supplier_id: (query.supplier_id as string) || "",
  };

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();
    const [rpcErr, result] = await tryCatch(
      odoo.execute_kw("purchase.order.api", "get_purchase_orders", [
        [paramsPayload],
      ]),
    );
    if (rpcErr) throw rpcErr;
    return result;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في جلب أوامر الشراء: ${error.message}`,
    });
  }
});
