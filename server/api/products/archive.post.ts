export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);

  if (!body.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "معرّف المنتج مطلوب",
    });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();
    await odoo.execute_kw("product.product", "write", [
      [[body.id], { active: false }],
    ]);

    return { success: true, message: "تم أرشفة المنتج بنجاح" };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في أرشفة المنتج: ${error.message}`,
    });
  }
});
