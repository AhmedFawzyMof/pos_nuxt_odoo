import { defineEventHandler } from "h3";
import { getAdminOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name, type, parentId, barcode } = body;

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "اسم الموقع مطلوب",
    });
  }

  const odoo = await getAdminOdooClient();
  await requirePermission(event, 'stock_manager')

  const typeMapping: Record<string, string> = {
    internal: "internal",
    scrap: "inventory",
    view: "view",
  };

  const odooPayload = {
    name: name.trim(),
    usage: typeMapping[type] || "internal",
    location_id: parentId ? Number(parentId) : false,
    barcode: barcode || false,
  };

  const [newLocationError, newLocationId] = await tryCatch(
    odoo.create("stock.location", odooPayload),
  );

  if (newLocationError) {
    console.error("Sync Error:", newLocationError);
    throw createError({
      statusCode: 500,
      message: `فشل في إنشاء الموقع: ${newLocationError.message}`,
    });
  }

  return {
    success: true,
    id: newLocationId,
    message: "تم إنشاء الموقع بنجاح",
  };
});
