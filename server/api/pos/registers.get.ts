import { defineEventHandler, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  const [connectErr] = await tryCatch(odoo.connect());
  if (connectErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل الاتصال بالخادم: ${connectErr.message}`,
    });
  }

  // Calls your new unified method directly from pos.config
  const [rpcErr, rpcResult] = await tryCatch(
    odoo.execute_kw("pos.config", "get_all_registers_with_status_rpc", [[]]),
  );

  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `RPC Core Error: ${rpcErr.message}`,
    });
  }

  if (rpcResult.status === "error") {
    throw createError({
      statusCode: 400,
      statusMessage: rpcResult.message || "فشل جلب أجهزة الكاشير من النظام.",
    });
  }

  // Your Python code returns exactly { status: 'success', data: [...] }
  return {
    success: true,
    data: rpcResult.data || [],
  };
});
