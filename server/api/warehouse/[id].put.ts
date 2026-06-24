import { defineEventHandler } from "h3";
import { getAdminOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const { name, barcode } = body;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "معرف الموقع مطلوب" });
  }

  const odoo = await getAdminOdooClient();
  await requirePermission(event, 'stock_manager');

  const vals: Record<string, any> = {};
  if (name !== undefined) vals.name = name.trim();
  if (barcode !== undefined) vals.barcode = barcode;

  const [err] = await tryCatch(
    odoo.execute_kw("stock.location", "write", [[[Number(id)], vals]])
  );

  if (err) {
    throw createError({
      statusCode: 500,
      message: `فشل في تحديث الموقع: ${err.message}`,
    });
  }

  return { success: true, message: "تم تحديث الموقع بنجاح" };
});
