export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.id) {
    return createError({
      statusCode: 400,
      statusMessage: "معرّف المنتج مطلوب",
    });
  }

  const session = await getUserSession(event);

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();

    await odoo.execute_kw("product.product", "unlink", [[body.id]]);

    return {
      success: true,
      message: "تم حذف المنتج بنجاح",
    };
  } catch (error: any) {
    return createError({
      statusCode: 500,
      statusMessage: `Odoo Bulk Fetch Failed: ${error.message}`,
    });
  }
});
