import { defineEventHandler, readBody } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "معرّف القسم مطلوب",
    });
  }

  const odoo = await getOdooClient(event);
  await requirePermission(event, 'pos_manager')

  await odoo.execute_kw("pos.category", "unlink", [[body.id]]);

  return {
    success: true,
    message: "تم حذف القسم بنجاح",
  };
});
