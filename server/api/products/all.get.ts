import { defineEventHandler } from "h3";
import { connectToOdoo } from "~~/server/utils/client";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const query = getQuery(event);
  const page = Math.max(1, parseInt((query.page as string) || "1"));
  const limit = 28;
  const offset = (page - 1) * limit;

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();

    const productFields = [
      "id", "name", "display_name", "barcode", "type", "categ_id",
      "lst_price", "standard_price", "qty_available", "virtual_available",
      "incoming_qty", "outgoing_qty", "weight", "volume", "sale_ok",
      "purchase_ok", "active", "available_in_pos", "pos_categ_ids", "image_1920",
    ];

    const [totalCount, categoriesData, locationsData, products] = await Promise.all([
      odoo.execute_kw("product.product", "search_count", [[[["id", "not in", [1, 2, 3]]]]]),
      odoo.searchRead("pos.category", [], ["id", "name"]),
      odoo.searchRead("stock.location", [["usage", "=", "internal"]], ["id", "name"]),
      odoo.searchRead("product.product", [["id", "not in", [1, 2, 3]]], productFields, {
        limit, offset, order: "id desc",
      }),
    ]);

    const categoryMap: Record<number, string> = {};
    for (const cat of categoriesData) categoryMap[cat.id] = cat.name;

    const locationMap: Record<number, string> = {};
    for (const loc of locationsData) locationMap[loc.id] = loc.name;

    const productIds = products.map((p: any) => p.id);
    let productLocationMap: Record<number, number> = {};
    if (productIds.length > 0) {
      const quants = await odoo.searchRead(
        "stock.quant",
        [["product_id", "in", productIds]],
        ["product_id", "location_id"],
      );
      for (const q of quants) {
        const pid = Array.isArray((q as any).product_id)
          ? (q as any).product_id[0]
          : (q as any).product_id;
        const lid = Array.isArray((q as any).location_id)
          ? (q as any).location_id[0]
          : (q as any).location_id;
        if (lid && !productLocationMap[pid]) {
          productLocationMap[pid] = lid;
        }
      }
    }

    const completeProducts = products.map((product: any) => {
      const resolvedPosCategories = (product.pos_categ_ids || []).map(
        (catId: number) => ({
          id: catId,
          name: categoryMap[catId] || "Unknown Category",
        }),
      );

      const locId = productLocationMap[product.id];
      return {
        ...product,
        list_price: product.lst_price || product.list_price || 0,
        pos_categories: resolvedPosCategories,
        internal_category: product.categ_id
          ? { id: product.categ_id[0], name: product.categ_id[1] }
          : null,
        location:
          locId && locationMap[locId]
            ? { id: locId, name: locationMap[locId] }
            : null,
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
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في جلب المنتجات: ${error.message}`,
    });
  }
});
