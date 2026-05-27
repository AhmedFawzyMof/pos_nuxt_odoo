import { defineEventHandler } from "h3";
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

    const verifiedItems = [];

    for (const item of items) {
      let finalProductId = item.productId;

      if (!finalProductId && item.createNewProduct && item.productName) {
        finalProductId = await odoo.create("product.product", {
          name: item.productName,
          type: "product",
          barcode: item.productName.match(/^[0-9]+$/)
            ? item.productName
            : false,
        });
      }

      if (finalProductId) {
        verifiedItems.push({
          productId: finalProductId,
          quantity: item.quantity,
        });
      }
    }

    const transactionPromises = verifiedItems.map((item) => {
      return odoo.create("stock.move", {
        name: `UI Batch Transfer Log Row`,
        product_id: Number(item.productId),
        product_uom_qty: Number(item.quantity),
        product_uom: 1,
        location_id: Number(sourceLocationId),
        location_dest_id: Number(destinationLocationId),
      });
    });

    await Promise.all(transactionPromises);

    return { success: true, processedCount: verifiedItems.length };
  } catch (error: any) {
    console.error("Odoo Batch Processing Fail:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في معالجة النقل المخزني: ${error.message}`,
    });
  }
});
