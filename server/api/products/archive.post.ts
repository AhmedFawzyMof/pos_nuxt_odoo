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

  await odoo.execute_kw("product.product", "write", [
    [[body.id], { active: false }],
  ]);

  return { success: true, message: "تم أرشفة المنتج بنجاح" };
});
