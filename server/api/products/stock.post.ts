import { defineEventHandler, createError } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const ids: number[] = body?.ids || [];
  if (!ids.length) {
    return { success: true, stockMap: {} };
  }

  const odoo = await getOdooClient(event);

  const [products, locations, quants] = await Promise.all([
      odoo.searchRead(
        "product.product",
        [["id", "in", ids]],
        ["id", "qty_available"],
      ),
      odoo.searchRead(
        "stock.location",
        [["usage", "=", "internal"]],
        ["id", "name"],
      ),
      odoo.searchRead(
        "stock.quant",
        [["product_id", "in", ids]],
        ["product_id", "location_id", "quantity"],
      ),
    ]);

    const locationMap: Record<number, string> = {};
    for (const loc of locations) locationMap[loc.id] = loc.name;

    const qtyMap: Record<number, number> = {};
    for (const p of products) qtyMap[p.id] = p.qty_available || 0;

    const stockLocationsMap: Record<number, { location_id: number; location_name: string; qty: number }[]> = {};
    for (const q of quants) {
      const pid = Array.isArray(q.product_id) ? q.product_id[0] : q.product_id;
      const lid = Array.isArray(q.location_id) ? q.location_id[0] : q.location_id;
      if (lid && locationMap[lid]) {
        if (!stockLocationsMap[pid]) stockLocationsMap[pid] = [];
        stockLocationsMap[pid].push({
          location_id: lid,
          location_name: locationMap[lid],
          qty: q.quantity || 0,
        });
      }
    }

    const stockMap: Record<number, any> = {};
    for (const id of ids) {
      stockMap[id] = {
        qty_available: qtyMap[id] || 0,
        stock_locations: stockLocationsMap[id] || [],
      };
    }

  return { success: true, stockMap };
});
