import OdooAwait from "odoo-await";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const session = await getUserSession(event);

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();
    // const odooTypeMapping: Record<string, string> = {
    //   product: "goods",
    //   consu: "consu",
    //   service: "service",
    // };
    const productValues: any = {
      name: body.name,
      barcode:
        body.variants && body.variants.length > 0
          ? false
          : body.barcode || false,
      type: "consu",
      list_price: isNaN(Number(body.list_price))
        ? 0.0
        : Number(body.list_price),
      standard_price: isNaN(Number(body.standard_price))
        ? 0.0
        : Number(body.standard_price),
      weight: isNaN(Number(body.weight)) ? 0.0 : Number(body.weight),
      volume: isNaN(Number(body.volume)) ? 0.0 : Number(body.volume),
      sale_ok: Boolean(body.sale_ok),
      purchase_ok: Boolean(body.purchase_ok),
      active: Boolean(body.active),
      available_in_pos: Boolean(body.available_in_pos),
    };

    if (body.image_1920 !== undefined) {
      if (body.image_1920) {
        const match = body.image_1920.match(/^data:image\/\w+;base64,(.+)$/);
        productValues.image_1920 = match ? match[1] : body.image_1920;
      } else {
        productValues.image_1920 = false;
      }
    }

    let templateId: number;
    let isEditMode = !!body.id;

    if (isEditMode) {
      const currentProducts: any = await odoo.searchRead(
        "product.product",
        [["id", "=", body.id]],
        ["product_tmpl_id"],
      );

      if (!currentProducts || currentProducts.length === 0) {
        return createError({
          statusCode: 404,
          statusMessage: "المنتج غير موجود بالنظام",
        });
      }

      templateId = currentProducts[0].product_tmpl_id[0];
      await odoo.execute_kw("product.template", "write", [
        [templateId],
        productValues,
      ]);
    } else {
      templateId = await odoo.execute_kw("product.template", "create", [
        [productValues],
      ]);
    }

    if (body.variants && body.variants.length > 0) {
      let attributeId = await getOrCreateAttribute(odoo, "المواصفات");

      const valueIds: number[] = [];

      for (const variant of body.variants) {
        if (variant.name_suffix.trim()) {
          const valId = await getOrCreateAttributeValue(
            odoo,
            attributeId,
            variant.name_suffix.trim(),
          );
          valueIds.push(valId);
        }
      }

      if (valueIds.length > 0) {
        const existingLines: any = await odoo.searchRead(
          "product.template.attribute.line",
          [
            ["product_tmpl_id", "=", templateId],
            ["attribute_id", "=", attributeId],
          ],
          ["id"],
        );

        if (existingLines.length > 0) {
          await odoo.execute_kw("product.template.attribute.line", "write", [
            [existingLines[0].id],
            { value_ids: [[6, 0, valueIds]] },
          ]);
        } else {
          await odoo.execute_kw("product.template.attribute.line", "create", [
            [
              {
                product_tmpl_id: templateId,
                attribute_id: attributeId,
                value_ids: [[6, 0, valueIds]],
              },
            ],
          ]);
        }

        const generatedVariants: any = await odoo.searchRead(
          "product.product",
          [["product_tmpl_id", "=", templateId]],
          ["id", "name", "product_template_attribute_value_ids"],
        );

        for (const variantData of generatedVariants) {
          const matchedVariantForm = body.variants.find(
            (v: any) =>
              variantData.name.includes(v.name_suffix) ||
              generatedVariants.length === 1,
          );

          if (matchedVariantForm) {
            const updateData: any = {};
            if (matchedVariantForm.barcode) {
              updateData.barcode = matchedVariantForm.barcode;
            }

            if (Object.keys(updateData).length > 0) {
              await odoo.execute_kw("product.product", "write", [
                [variantData.id],
                updateData,
              ]);
            }

            if (
              matchedVariantForm.price_extra !== undefined &&
              variantData.product_template_attribute_value_ids?.length > 0
            ) {
              await odoo.execute_kw(
                "product.template.attribute.value",
                "write",
                [
                  [variantData.product_template_attribute_value_ids[0]],
                  { price_extra: Number(matchedVariantForm.price_extra) },
                ],
              );
            }
          }
        }
      }
    }

    if (!body.variants || body.variants.length === 0) {
      const finalProductId = isEditMode
        ? body.id
        : await getVariantIdFromTemplate(odoo, templateId);
      if (finalProductId && body.qty_available !== undefined) {
        await updateOdooStock(odoo, finalProductId, Number(body.qty_available));
      }
    }

    return {
      success: true,
      message: isEditMode ? "تم تحديث المنتج بنجاح" : "تم إنشاء المنتج بنجاح",
      id: templateId,
    };
  } catch (error: any) {
    console.error("Odoo Save Error: ", error);
    return createError({
      statusCode: 500,
      statusMessage: `فشل في حفظ البيانات في Odoo: ${error.message}`,
    });
  }
});

async function getOrCreateAttribute(odoo: any, name: string): Promise<number> {
  const res: any = await odoo.searchRead(
    "product.attribute",
    [["name", "=", name]],
    ["id"],
    { limit: 1 },
  );
  if (res.length > 0) return res[0].id;
  return await odoo.execute_kw("product.attribute", "create", [
    [{ name, create_variant: "always" }],
  ]);
}

async function getOrCreateAttributeValue(
  odoo: any,
  attributeId: number,
  valueName: string,
): Promise<number> {
  const res: any = await odoo.searchRead(
    "product.attribute.value",
    [
      ["name", "=", valueName],
      ["attribute_id", "=", attributeId],
    ],
    ["id"],
    { limit: 1 },
  );
  if (res.length > 0) return res[0].id;
  return await odoo.execute_kw("product.attribute.value", "create", [
    [{ name: valueName, attribute_id: attributeId }],
  ]);
}

async function getVariantIdFromTemplate(
  odoo: any,
  templateId: number,
): Promise<number | null> {
  const res: any = await odoo.searchRead(
    "product.product",
    [["product_tmpl_id", "=", templateId]],
    ["id"],
    { limit: 1 },
  );
  return res.length > 0 ? res[0].id : null;
}

async function updateOdooStock(odoo: any, productId: number, newQty: number) {
  try {
    const quantIds: any = await odoo.searchRead(
      "stock.quant",
      [
        ["product_id", "=", productId],
        ["location_id.usage", "=", "internal"],
      ],
      ["id"],
    );

    if (quantIds.length > 0) {
      await odoo.execute_kw("stock.quant", "write", [
        [quantIds[0].id],
        { inventory_quantity: newQty },
      ]);
      await odoo.execute_kw("stock.quant", "action_apply_inventory", [
        [quantIds[0].id],
      ]);
    } else {
      const locations: any = await odoo.searchRead(
        "stock.location",
        [["usage", "=", "internal"]],
        ["id"],
        { limit: 1 },
      );

      if (locations.length > 0) {
        const newQuant = await odoo.execute_kw("stock.quant", "create", [
          [
            {
              product_id: productId,
              location_id: locations[0].id,
              inventory_quantity: newQty,
            },
          ],
        ]);
        await odoo.execute_kw("stock.quant", "action_apply_inventory", [
          [newQuant],
        ]);
      }
    }
  } catch (e: any) {
    console.warn(`تنبيه: لم يتم تحديث كمية المخزن. خطأ: ${e?.message || e}`);
  }
}
