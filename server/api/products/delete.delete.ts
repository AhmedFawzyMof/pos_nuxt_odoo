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

  await odoo.execute_kw("product.product", "unlink", [[body.id]]);

  return {
    success: true,
    message: "تم حذف المنتج بنجاح",
  };
});
