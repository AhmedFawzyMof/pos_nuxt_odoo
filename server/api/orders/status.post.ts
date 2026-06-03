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
  const state = String(body?.state || "").trim();

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: "معرّف الطلب مطلوب" });
  }
  if (!state) {
    throw createError({ statusCode: 400, statusMessage: "الحالة المطلوبة مطلوبة" });
  }

  const validStates = ["draft", "paid", "done", "cancelled", "invoiced"];
  if (!validStates.includes(state)) {
    throw createError({
      statusCode: 400,
      statusMessage: `حالة غير صالحة. الحالات المسموحة: ${validStates.join(", ")}`,
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
    odoo.execute_kw("pos.order", "update_order_status_rpc", [[orderId, state]]),
  );

  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل تحديث حالة الطلب: ${rpcErr.message}`,
    });
  }

  if (result?.status === "error") {
    throw createError({
      statusCode: 400,
      statusMessage: result.message || "فشل تحديث حالة الطلب",
    });
  }

  return {
    success: true,
    message: result?.message || "تم تحديث حالة الطلب بنجاح",
    order_id: orderId,
    state,
  };
});
