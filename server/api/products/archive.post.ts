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
    await odoo.execute_kw("product.product", "write", [
      [body.id],
      { active: false },
    ]);

    return { success: true, message: "تم أرشفة المنتج بنجاح" };
  } catch (error: any) {
    return createError({
      statusCode: 500,
      statusMessage: `فشل في أرشفة المنتج: ${error.message}`,
    });
  }
});
