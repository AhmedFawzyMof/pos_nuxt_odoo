import { defineEventHandler, getQuery, createError } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const poId = query.id as string;
  if (!poId) {
    throw createError({
      statusCode: 400,
      statusMessage: "معرف أمر الشراء مطلوب",
    });
  }

  const odoo = await getOdooClient(event);
  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("purchase.order.api", "get_purchase_order_detail", [
      [poId],
    ]),
  );
  if (rpcErr) throw rpcErr;
  return result;
});
