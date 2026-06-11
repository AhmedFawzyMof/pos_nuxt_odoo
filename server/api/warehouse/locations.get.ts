import { defineEventHandler } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event);

  const [err, rawLocations] = await tryCatch(
    odoo.execute_kw("warehouse.location.api", "get_locations_with_capacity", [
      [],
    ]),
  );

  if (err) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في جلب المواقع: ${err.message}`,
    });
  }

  return {
    success: true,
    data: rawLocations as any[],
  };
});
