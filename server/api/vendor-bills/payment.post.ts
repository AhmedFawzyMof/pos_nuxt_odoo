import { defineEventHandler, readBody, createError } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event);
  await requirePermission(event, 'Accounting / Invoicing')
  const body = await readBody(event);
  if (!body?.bill_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "معرف الفاتورة مطلوب",
    });
  }

  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("vendor.bill.api", "register_vendor_payment", [[body]]),
  );
  if (rpcErr) {
    throw createError({
      statusCode: 500,
      message: `فشل في تسجيل الدفعة: ${rpcErr.message}`,
    });
  }

  return result;
});
