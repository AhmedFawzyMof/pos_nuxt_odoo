import { defineEventHandler, createError, readBody } from "h3";
import { connectToOdoo } from "~~/server/utils/client";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);
  const { sourceLocationId, destinationLocationId, items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "قائمة المواد المنقولة فارغة",
    });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();

    const moveLines = [];
    for (const item of items) {
      let finalProductId = item.productId;

      if (!finalProductId && item.createNewProduct && item.productName) {
        finalProductId = await odoo.create("product.product", {
          name: item.productName,
          type: "product",
          default_code: item.productName,
        });
      }

      if (finalProductId) {
        const productData = (await odoo.searchRead(
          "product.product",
          [["id", "=", Number(finalProductId)]],
          ["uom_id"],
        )) as any[];
        const uomId = productData[0]?.uom_id[0] || 1;

        moveLines.push({
          productId: Number(finalProductId),
          quantity: Number(item.quantity),
          uomId: uomId,
        });
      }
    }

    if (moveLines.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "لا توجد منتجات صالحة للنقل",
      });
    }

    const pickingTypes = (await odoo.searchRead(
      "stock.picking.type",
      [["code", "=", "internal"]],
      ["id"],
      { limit: 1 },
    )) as any[];

    if (!pickingTypes.length) {
      throw createError({
        statusCode: 500,
        statusMessage: "لم يتم العثور على نوع عملية النقل الداخلي",
      });
    }
    const pickingTypeId = pickingTypes[0].id;

    const pickingId = await odoo.create("stock.picking", {
      picking_type_id: pickingTypeId,
      location_id: Number(sourceLocationId),
      location_dest_id: Number(destinationLocationId),
      origin: "Nuxt Custom Frontend Transfer",
    });

    for (const line of moveLines) {
      await odoo.create("stock.move", {
        picking_id: pickingId,
        name: `Transfer Line Row`,
        product_id: line.productId,
        product_uom_qty: line.quantity,
        product_uom: line.uomId,
        location_id: Number(sourceLocationId),
        location_dest_id: Number(destinationLocationId),
      });
    }

    await odoo.execute_kw("stock.picking", "action_confirm", [[pickingId]]);
    await odoo.execute_kw("stock.picking", "action_assign", [[pickingId]]);

    await odoo.execute_kw("stock.picking", "button_validate", [[pickingId]]);

    return {
      success: true,
      pickingId: pickingId,
      processedCount: moveLines.length,
    };
  } catch (error: any) {
    console.error("Odoo Batch Processing Fail:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في معالجة النقل المخزني: ${error.message}`,
    });
  }
});
