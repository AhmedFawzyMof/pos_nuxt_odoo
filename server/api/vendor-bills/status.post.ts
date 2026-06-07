import { defineEventHandler, readBody, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  const [connectErr] = await tryCatch(odoo.connect());
  if (connectErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل الاتصال بالخادم: ${connectErr.message}`,
    });
  }

  const body = await readBody(event);
  if (!body?.bill_id || !body?.status) {
    throw createError({
      statusCode: 400,
      statusMessage: "معرف الفاتورة والحالة الجديدة مطلوبان",
    });
  }

  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("vendor.bill.api", "update_vendor_bill_status", [
      [body.bill_id, body.status],
    ]),
  );
  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في تحديث حالة الفاتورة: ${rpcErr.message}`,
    });
  }

  return result;
});
