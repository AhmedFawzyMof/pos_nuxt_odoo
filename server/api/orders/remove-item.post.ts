import { defineEventHandler, readBody, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);
  const orderId = Number(body?.order_id) || 0;
  const lineId = Number(body?.line_id) || 0;

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: "معرّف الطلب مطلوب" });
  }
  if (!lineId) {
    throw createError({
      statusCode: 400,
      statusMessage: "معرّف الصنف المطلوب حذفه مطلوب",
    });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  const [connectErr] = await tryCatch(odoo.connect());
  if (connectErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل الاتصال بـ Odoo: ${connectErr.message}`,
    });
  }

  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("pos.order", "remove_order_line_rpc", [
      [orderId, lineId],
    ]),
  );

  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل حذف الصنف من الطلب: ${rpcErr.message}`,
    });
  }

  if (result?.status === "error") {
    throw createError({
      statusCode: 400,
      statusMessage: result.message || "فشل حذف الصنف من الطلب",
    });
  }

  return {
    success: true,
    message: result?.message || "تم حذف الصنف من الطلب بنجاح",
    order_id: orderId,
    line_id: lineId,
  };
});
