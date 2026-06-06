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
      statusMessage: `فشل الاتصال بأودو: ${connectErr.message}`,
    });
  }

  const body = await readBody(event);
  if (!body) {
    throw createError({ statusCode: 400, statusMessage: "بيانات الفاتورة مطلوبة" });
  }

  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("vendor.bill.api", "create_vendor_bill", [
      [body],
    ]),
  );
  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في إنشاء الفاتورة: ${rpcErr.message}`,
    });
  }

  return result;
});
