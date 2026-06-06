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
  if (!body?.partner_id || !body?.lines?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "المورد والمنتجات مطلوبان",
    });
  }

  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("purchase.order.api", "create_purchase_order", [
      [body],
    ]),
  );
  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في إنشاء أمر الشراء: ${rpcErr.message}`,
    });
  }

  return result;
});
