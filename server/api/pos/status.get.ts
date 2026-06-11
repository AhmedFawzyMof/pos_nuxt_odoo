import { defineEventHandler, getQuery, createError } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const configId = String(query.config_id ?? "").trim();

  if (!configId || configId === "null") {
    throw createError({
      statusCode: 400,
      statusMessage: "معرف نقطة البيع مفقود",
    });
  }

  const odoo = await getOdooClient(event);

  const [rpcErr, rpcResult] = await tryCatch(
    odoo.execute_kw("pos.session", "control_pos_session_rpc", [
      [],
      {
        config_id: parseInt(configId, 10),
        action: "status",
      },
    ]),
  );

  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل جلب حالة الوردية: ${rpcErr.message}`,
    });
  }

  if (rpcResult.status === "error") {
    throw createError({
      statusCode: 400,
      statusMessage: rpcResult.message,
    });
  }

  return {
    success: true,
    session: rpcResult.session,
  };
});
