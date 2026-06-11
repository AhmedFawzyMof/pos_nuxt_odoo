import { defineEventHandler, readBody, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event);
  const body = await readBody(event);
  if (!body?.bill_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "معرف الفاتورة مطلوب",
    });
  }

  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("vendor.bill.api", "register_vendor_payment", [
      [body],
    ]),
  );
  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في تسجيل الدفعة: ${rpcErr.message}`,
    });
  }

  return result;
});
