import { defineEventHandler, readBody } from "h3";
import { connectToOdoo } from "~~/server/utils/client";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "معرّف القسم مطلوب",
    });
  }

  const odoo = await getOdooClient(event);

  await odoo.execute_kw("pos.category", "unlink", [[body.id]]);

  return {
    success: true,
    message: "تم حذف القسم بنجاح",
  };
});
