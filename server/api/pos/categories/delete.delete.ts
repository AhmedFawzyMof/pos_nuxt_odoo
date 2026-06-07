import { defineEventHandler, readBody } from "h3";
import { connectToOdoo } from "~~/server/utils/client";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);

  if (!body.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "معرّف القسم مطلوب",
    });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();

    await odoo.execute_kw("pos.category", "unlink", [[body.id]]);

    return {
      success: true,
      message: "تم حذف القسم بنجاح",
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل حذف القسم: ${error.message}`,
    });
  }
});
