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

    const totalCount = await odoo.execute_kw(
      "product.product",
      "search_count",
      [[[["id", "not in", [1, 2, 3]]]]],
    );

    const categoriesData = await odoo.searchRead(
      "pos.category",
      [],
      ["id", "name"],
    );
    const categoryMap: any = categoriesData.reduce((acc: any, cat: any) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});

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
    ];

    const products = await odoo.searchRead(
      "product.product",
      [["id", "not in", [1, 2, 3]]],
      productFields,
      {
        limit: limit,
        offset: offset,
        order: "id desc",
      },
    );

    const completeProducts = products.map((product: any) => {
      const resolvedPosCategories = (product.pos_categ_ids || []).map(
        (catId: number) => ({
          id: catId,
          name: categoryMap[catId] || "Unknown Category",
        }),
      );

      return {
        ...product,
        list_price: product.lst_price || product.list_price || 0,
        pos_categories: resolvedPosCategories,
        internal_category: product.categ_id
          ? { id: product.categ_id[0], name: product.categ_id[1] }
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
