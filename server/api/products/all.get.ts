import { defineEventHandler } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Math.max(1, parseInt((query.page as string) || "1"));
  const limit = 28;
  const offset = (page - 1) * limit;

  const odoo = await getOdooClient(event);

  const productFields = [
      "id",
      "name",
      "display_name",
      "barcode",
      "type",
      "categ_id",
      "lst_price",
      "standard_price",
      "qty_available",
      "virtual_available",
      "incoming_qty",
      "outgoing_qty",
      "weight",
      "volume",
      "sale_ok",
      "purchase_ok",
      "active",
      "available_in_pos",
      "pos_categ_ids",
      "image_1920",
      "taxes_id",
      "to_weight",
    ];

    const [totalCount, categoriesData, locationsData, taxesData, products] =
      await Promise.all([
        odoo.execute_kw("product.product", "search_count", [
          [[["id", "not in", [1, 2, 3]]]],
        ]),
        odoo.searchRead("pos.category", [], ["id", "name"]),
        odoo.searchRead(
          "stock.location",
          [["usage", "=", "internal"]],
          ["id", "name"],
        ),
        odoo.searchRead(
          "account.tax",
          [["type_tax_use", "=", "sale"]],
          ["id", "name", "amount", "amount_type", "price_include"],
        ),
        odoo.searchRead(
          "product.product",
          [["id", "not in", [1, 2, 3]]],
          productFields,
          {
            limit,
            offset,
            order: "id desc",
          },
        ),
      ]);

    const categoryMap: Record<number, string> = {};
    for (const cat of categoriesData) categoryMap[cat.id] = cat.name;

    const locationMap: Record<number, string> = {};
    for (const loc of locationsData) locationMap[loc.id] = loc.name;

    const taxMap: Record<number, { id: number; name: string; amount: number; amount_type?: string; price_include?: boolean }> = {};
    for (const tax of taxesData) taxMap[tax.id] = tax;

    const productIds = products.map((p: any) => p.id);
    let productStockLocations: Record<
      number,
      { location_id: number; location_name: string; qty: number }[]
    > = {};
    if (productIds.length > 0) {
      const quants = await odoo.searchRead(
        "stock.quant",
        [["product_id", "in", productIds]],
        ["product_id", "location_id", "quantity"],
      );
      for (const q of quants) {
        const pid = Array.isArray((q as any).product_id)
          ? (q as any).product_id[0]
          : (q as any).product_id;
        const lid = Array.isArray((q as any).location_id)
          ? (q as any).location_id[0]
          : (q as any).location_id;
        if (lid && locationMap[lid]) {
          if (!productStockLocations[pid]) productStockLocations[pid] = [];
          productStockLocations[pid].push({
            location_id: lid,
            location_name: locationMap[lid],
            qty: (q as any).quantity || 0,
          });
        }
      }
    }

    const completeProducts = products.map((product: any) => {
      const resolvedPosCategories = (product.pos_categ_ids || []).map(
        (catId: any) => ({
          id: Array.isArray(catId) ? catId[0] : catId,
          name:
            categoryMap[Array.isArray(catId) ? catId[0] : catId] ||
            "Unknown Category",
        }),
      );

      const stockLocs = productStockLocations[product.id] || [];
      const firstLoc = stockLocs[0];
      const rawTaxesId = product.taxes_id || [];
      const resolvedTaxes = rawTaxesId
        .reduce((acc: number[], t: any) => {
          const id = Array.isArray(t) ? Number(t[0]) : Number(t);
          if (id > 0) acc.push(id);
          return acc;
        }, [])
        .map((id: number) => taxMap[id])
        .filter(Boolean);
      return {
        ...product,
        list_price: product.lst_price || product.list_price || 0,
        pos_categories: resolvedPosCategories,
        taxes_id: resolvedTaxes.map((t: any) => t.id),
        taxes: resolvedTaxes,
        internal_category: product.categ_id
          ? { id: product.categ_id[0], name: product.categ_id[1] }
          : null,
        location:
          firstLoc && locationMap[firstLoc.location_id]
            ? { id: firstLoc.location_id, name: firstLoc.location_name }
            : null,
        stock_locations: stockLocs,
      };
    });

  return {
    success: true,
    totalItems: totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    itemsPerPage: limit,
    data: completeProducts,
  };
});
