import { defineEventHandler } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);
  const { name, type, parentId, barcode } = body;

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "اسم الموقع مطلوب",
    });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  const [err] = await tryCatch(odoo.connect());

  if (err) {
    console.error("Odoo Sync Error:", err.message);
    throw createError({
      statusCode: 500,
      statusMessage: `فشل الاتصال بأودو: ${err.message}`,
    });
  }

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
    console.error("Odoo Sync Error:", newLocationError);
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في إنشاء الموقع: ${newLocationError.message}`,
    });
  }

  return {
    success: true,
    id: newLocationId,
    message: "تم إنشاء الموقع بنجاح",
  };
});
