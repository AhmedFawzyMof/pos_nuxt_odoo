import { defineEventHandler, getQuery } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
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

  const query = getQuery(event);
  const searchQuery = ((query.query as string) || "").trim();
  const locationId = query.locationId
    ? parseInt(query.locationId as string, 10)
    : null;

  if (!searchQuery) {
    return { success: true, data: [] };
  }

  const domain: any[] = [
    "|",
    ["name", "ilike", searchQuery],
    "|",
    ["barcode", "ilike", searchQuery],
    ["default_code", "ilike", searchQuery],
  ];

  const [searchErr, products] = await tryCatch(
    odoo.execute_kw("product.product", "search_read", [
      [domain],
      {
        fields: ["id", "name", "barcode"],
        limit: 20,
      },
    ]),
  );

  if (searchErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في البحث عن المنتجات: ${searchErr.message}`,
    });
  }

  const productIds = products.map((p: any) => p.id);
  let quantitiesByProduct: Record<number, number> = {};

  if (locationId && productIds.length > 0) {
    const [quantErr, quants] = await tryCatch(
      odoo.searchRead(
        "stock.quant",
        [
          ["product_id", "in", productIds],
          ["location_id", "=", locationId],
        ],
        ["product_id", "quantity"],
      ),
    );

    if (!quantErr && quants) {
      for (const q of quants) {
        const pid = Array.isArray(q.product_id)
          ? q.product_id[0]
          : q.product_id;
        quantitiesByProduct[pid] = q.quantity || 0;
      }
    }
  }

  const data = products
    .map((p: any) => {
      const qty = quantitiesByProduct[p.id] ?? 0;
      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode || "",
        quantity: locationId ? qty : undefined,
      };
    })
    .filter((p) => !locationId || p.quantity > 0);

  return { success: true, data };
});
