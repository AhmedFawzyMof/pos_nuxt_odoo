import { defineEventHandler, readBody, createError } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const configId = parseInt(body.config_id as string, 10);
  const action = String(body.action || "").trim();
  const openingCash = parseFloat(body.opening_cash as string) || 0.0;

  if (!configId || !["open", "close", "status"].includes(action)) {
    throw createError({
      statusCode: 400,
      message:
        "Invalid request: config_id and action (open/close/status) required",
    });
  }

  const odoo = await getOdooClient(event);
  await requirePermission(event, 'Point of Sale / User')

  const [rpcErr, rpcResult] = await tryCatch(
    odoo.execute_kw("pos.session", "control_pos_session_rpc", [
      [configId, action, openingCash],
    ]),
  );

  if (rpcErr) {
    throw createError({
      statusCode: 500,
      message: `RPC failed: ${rpcErr.message}`,
    });
  }

  if (rpcResult.status === "error") {
    throw createError({
      statusCode: 400,
      message: rpcResult.message || "Session control failed",
    });
  }

  return {
    success: true,
    session: rpcResult.session || null,
    message: rpcResult.message || `Session ${action} successful`,
  };
});
