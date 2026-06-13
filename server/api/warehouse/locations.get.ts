import { defineEventHandler } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event);
  await requirePermission(event, 'stock_user')

  const [err, rawLocations] = await tryCatch(
    odoo.execute_kw("warehouse.location.api", "get_locations_with_capacity", [
      [],
    ]),
  );

  if (err) {
    throw createError({
      statusCode: 500,
      message: `فشل في جلب المواقع: ${err.message}`,
    });
  }

  return {
    success: true,
    data: rawLocations as any[],
  };
});
