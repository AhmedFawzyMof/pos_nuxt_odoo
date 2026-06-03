import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const query = getQuery(event);

  const page = Math.max(1, parseInt((query.page as string) || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt((query.limit as string) || "20", 10)));
  const search = (query.search as string) || "";
  const status = (query.status as string) || "";
  const dateFrom = (query.date_from as string) || "";
  const dateTo = (query.date_to as string) || "";

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

  const domain: any[] = [];
  if (search) {
    domain.push(["name", "ilike", search]);
  }
  if (status) {
    domain.push(["state", "=", status]);
  }
  if (dateFrom) {
    domain.push(["date_order", ">=", dateFrom]);
  }
  if (dateTo) {
    domain.push(["date_order", "<=", dateTo]);
  }

  const [countErr, totalItems] = await tryCatch(
    odoo.searchCount("pos.order", domain),
  );
  if (countErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل حساب عدد الطلبات: ${countErr.message}`,
    });
  }

  const totalPages = Math.ceil(totalItems / limit);
  const offset = (page - 1) * limit;

  const fields = [
    "id", "name", "date_order", "partner_id", "user_id",
    "session_id", "amount_total", "amount_paid", "amount_tax",
    "amount_return", "state", "pos_reference",
  ];

  const [readErr, orders] = await tryCatch(
    odoo.searchRead("pos.order", domain, fields, limit, offset, "date_order desc"),
  );
  if (readErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل جلب الطلبات: ${readErr.message}`,
    });
  }

  return {
    success: true,
    data: orders || [],
    totalItems,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
  };
});
