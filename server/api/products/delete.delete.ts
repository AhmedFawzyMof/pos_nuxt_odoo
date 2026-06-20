import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "معرّف المنتج مطلوب",
    });
  }

  const odoo = await getAdminOdooClient();
  await requirePermission(event, 'pos_manager')

  const tmplFound = await odoo.execute_kw("product.template", "search", [
    [["id", "=", body.id]],
  ]);
  const model = tmplFound.length > 0 ? "product.template" : "product.product";
  await odoo.execute_kw(model, "unlink", [[body.id]]);

  return {
    success: true,
    message: "تم حذف المنتج بنجاح",
  };
});
