import { defineEventHandler, getQuery } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { type, date_from, date_to, ...filters } = getQuery(event);

  if (!type) {
    throw createError({ statusCode: 400, statusMessage: "Report type is required" });
  }

  const now = new Date();
  const defaultDateFrom = date_from || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultDateTo = date_to || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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

  const [rpcErr, data] = await tryCatch(
    odoo.execute_kw("pos.reports.api", "get_report_data", [[
      type as string,
      defaultDateFrom,
      defaultDateTo,
      filters,
    ]]),
  );
  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في جلب التقرير: ${rpcErr.message}`,
    });
  }

  return { success: true, ...data as any };
});
