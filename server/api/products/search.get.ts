import { defineEventHandler, getQuery, createError } from "h3";
import { tryCatch } from "~~/server/utils/tryCatch";
import { getOdooClient } from "~~/server/utils/odooClient";

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event);

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
        fields: ["id", "name", "barcode", "standard_price", "taxes_id"],
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
      const rawTaxes = p.taxes_id || [];
      const taxIds = rawTaxes
        .map((t: any) => (Array.isArray(t) ? Number(t[0]) : Number(t)))
        .filter((id: number) => id > 0);
      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode || "",
        standard_price: p.standard_price || 0,
        taxes_id: taxIds,
        quantity: locationId ? qty : undefined,
      };
    })
    .filter((p) => !locationId || p.quantity > 0);

  return { success: true, data };
});
