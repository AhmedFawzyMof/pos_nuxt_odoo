import { defineEventHandler, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event);

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
