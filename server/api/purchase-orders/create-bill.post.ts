import { defineEventHandler, readBody, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event);
  const body = await readBody(event);
  if (!body?.po_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "معرف أمر الشراء مطلوب",
    });
  }

  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("purchase.order.api", "create_bill_from_po", [
      [body.po_id],
    ]),
  );
  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في إنشاء الفاتورة من أمر الشراء: ${rpcErr.message}`,
    });
  }

  return result;
});
