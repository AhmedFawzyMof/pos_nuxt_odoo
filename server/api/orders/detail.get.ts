import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const query = getQuery(event);
  const orderId = parseInt((query.id as string) || "0", 10);
  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: "معرّف الطلب مطلوب" });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  const [connectErr] = await tryCatch(odoo.connect());
  if (connectErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل الاتصال بـ Odoo: ${connectErr.message}`,
    });
  }

  const orderFields = [
    "id", "name", "date_order", "partner_id", "user_id",
    "session_id", "amount_total", "amount_paid", "amount_tax",
    "amount_return", "state", "pos_reference", "company_id",
    "lines", "statement_ids",
  ];

  const [orderErr, orders] = await tryCatch(
    odoo.read("pos.order", [orderId], orderFields),
  );
  if (orderErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل جلب تفاصيل الطلب: ${orderErr.message}`,
    });
  }
  if (!orders || orders.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "الطلب غير موجود" });
  }

  const order = orders[0];

  let lines: any[] = [];
  if (order.lines && order.lines.length > 0) {
    const [linesErr, linesData] = await tryCatch(
      odoo.read("pos.order.line", order.lines, [
        "id", "product_id", "qty", "price_unit",
        "price_subtotal", "discount",
      ]),
    );
    if (!linesErr) lines = linesData || [];
  }

  let payments: any[] = [];
  if (order.statement_ids && order.statement_ids.length > 0) {
    const [payErr, payData] = await tryCatch(
      odoo.read("pos.payment", order.statement_ids, [
        "id", "payment_method_id", "amount", "payment_date", "payment_status",
      ]),
    );
    if (!payErr) payments = payData || [];
  }

  return {
    success: true,
    order,
    lines,
    payments,
  };
});
