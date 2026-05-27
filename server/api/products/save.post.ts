async function odooWrite(
  odoo: any,
  model: string,
  ids: number[],
  values: object,
): Promise<boolean> {
  return await odoo.execute_kw(model, "write", [[ids, values], {}]);
}
async function safeSearchRead(
  odoo: any,
  model: string,
  domain: any[],
  fields: string[],
  limit = 0,
) {
  const params: any[] = [domain, fields];
  if (limit) params.push(0, limit); // offset=0, limit=N
  return await odoo.execute_kw(model, "search_read", [params]);
}
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const session = await getUserSession(event);
  console.log(body);

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();

    const productValues: any = {
      name: body.name,
      pos_categ_ids: body.pos_categ_ids?.length
        ? [[6, 0, body.pos_categ_ids.map(Number)]]
        : [],
      barcode:
        body.variants && body.variants.length > 0
          ? false
          : body.barcode || false,
      type: ["consu", "service"].includes(body.type) ? body.type : "consu",
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
      to_weight: Boolean(body.to_weight),
      is_storable: true,
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
    const isEditMode = !!body.id;

    if (isEditMode) {
      const currentProducts: any = await safeSearchRead(
        odoo,
        "product.product",
        [["id", "=", body.id]],
        ["product_tmpl_id"],
      );

      if (!currentProducts || currentProducts.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "المنتج غير موجود بالنظام",
        });
      }

      templateId = currentProducts[0].product_tmpl_id[0];

      await odooWrite(odoo, "product.template", [templateId], productValues);
    } else {
      templateId = await odoo.execute_kw("product.template", "create", [
        [productValues],
      ]);
    }

    if (body.variants && body.variants.length > 0) {
      const attributeId = await getOrCreateAttribute(odoo, "المواصفات");
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
        const existingLines: any = await safeSearchRead(
          odoo,
          "product.template.attribute.line",
          [
            ["product_tmpl_id", "=", templateId],
            ["attribute_id", "=", attributeId],
          ],
          ["id"],
        );

        if (existingLines.length > 0) {
          // ✅ correct write
          await odooWrite(
            odoo,
            "product.template.attribute.line",
            [existingLines[0].id],
            { value_ids: [[6, 0, valueIds]] },
          );
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

        const generatedVariants: any = await safeSearchRead(
          odoo,
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

          if (!matchedVariantForm) continue;

          // ✅ update barcode on product.product
          if (matchedVariantForm.barcode) {
            await odooWrite(odoo, "product.product", [variantData.id], {
              barcode: matchedVariantForm.barcode,
            });
          }

          // ✅ update price_extra on attribute value
          if (
            matchedVariantForm.price_extra !== undefined &&
            variantData.product_template_attribute_value_ids?.length > 0
          ) {
            await odooWrite(
              odoo,
              "product.template.attribute.value",
              [variantData.product_template_attribute_value_ids[0]],
              { price_extra: Number(matchedVariantForm.price_extra) },
            );
          }
        }
      }
    }

    // ── Stock (no-variant products only) ─────────────────────────────────────
    if (!body.variants || body.variants.length === 0) {
      const finalProductId = isEditMode
        ? body.id
        : await getVariantIdFromTemplate(odoo, templateId);

      if (finalProductId && body.qty_available !== undefined) {
        await updateOdooStock(
          odoo,
          finalProductId,
          Number(body.qty_available),
          body.location_id,
        );
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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getOrCreateAttribute(odoo: any, name: string): Promise<number> {
  const res: any = await safeSearchRead(
    odoo,
    "product.attribute",
    [["name", "=", name]],
    ["id"],
    1,
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
  const res: any = await safeSearchRead(
    odoo,
    "product.attribute.value",
    [
      ["name", "=", valueName],
      ["attribute_id", "=", attributeId],
    ],
    ["id"],
    1,
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
  const res: any = await safeSearchRead(
    odoo,
    "product.product",
    [["product_tmpl_id", "=", templateId]],
    ["id"],
    1,
  );
  return res.length > 0 ? res[0].id : null;
}
async function updateOdooStock(
  odoo: any,
  productId: number,
  newQty: number,
  location_id?: number,
) {
  try {
    // 1. Get internal location
    const locations: any = await safeSearchRead(
      odoo,
      "stock.location",
      [["usage", "=", "internal"]],
      ["id"],
      1,
    );

    if (!locations.length) {
      console.error("No internal location found");
      return;
    }

    const locationId = location_id ? Number(location_id) : locations[0].id;

    // 2. Find existing quant
    const quants: any = await safeSearchRead(
      odoo,
      "stock.quant",
      [
        ["product_id", "=", productId],
        ["location_id", "=", locationId],
      ],
      ["id", "quantity"],
      1,
    );

    let quantId: number;

    if (quants.length > 0) {
      quantId = quants[0].id;

      // ✅ VERY IMPORTANT: enable inventory mode
      await odooWrite(odoo, "stock.quant", [quantId], {
        inventory_quantity: newQty,
      });
    } else {
      // create only if not exists
      quantId = await odoo.execute_kw("stock.quant", "create", [
        [
          {
            product_id: productId,
            location_id: locationId,
            inventory_quantity: newQty,
          },
        ],
      ]);
    }

    // 3. Apply inventory adjustment (SET value, not add)
    await odoo.execute_kw("stock.quant", "action_apply_inventory", [[quantId]]);

    console.log(`Stock set to ${newQty} for product ${productId}`);
  } catch (e: any) {
    console.error("Stock update error:", e);
  }
}
