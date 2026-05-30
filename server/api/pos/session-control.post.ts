import { defineEventHandler, readBody, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);
  const configId = parseInt(body.config_id as string, 10);
  const action = String(body.action || "").trim();
  const openingCash = parseFloat(body.opening_cash as string) || 0.0;

  if (!configId || !["open", "close", "status"].includes(action)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Invalid request: config_id and action (open/close/status) required",
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
      statusMessage: `Failed to connect: ${connectErr.message}`,
    });
  }

  const [rpcErr, rpcResult] = await tryCatch(
    odoo.execute_kw("pos.session", "control_pos_session_rpc", [
      [configId, action, openingCash],
    ]),
  );

  console.log(rpcResult);

  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `RPC failed: ${rpcErr.message}`,
    });
  }

  if (rpcResult.status === "error") {
    throw createError({
      statusCode: 400,
      statusMessage: rpcResult.message || "Session control failed",
    });
  }

  return {
    success: true,
    session: rpcResult.session || null,
    message: rpcResult.message || `Session ${action} successful`,
  };
});
