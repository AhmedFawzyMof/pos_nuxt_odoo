import { defineEventHandler, readBody, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);
  const sessionId = Number(body?.session_id) || null;
  console.log(sessionId);
  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "session_id is required",
    });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  const [connectErr] = await tryCatch(odoo.connect());
  if (connectErr) {
    console.log(connectErr);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to connect to Odoo instance: ${connectErr.message}`,
    });
  }

  const positionalParams = [sessionId, body];

  const [rpcErr, rpcResult] = await tryCatch(
    odoo.execute_kw("pos.session", "create_pos_order_rpc", [positionalParams]),
  );

  console.log(rpcErr, rpcResult);
  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `Odoo Core RPC Processing Failure: ${rpcErr.message}`,
    });
  }

  if (rpcResult.status === "error") {
    throw createError({
      statusCode: 400,
      statusMessage: rpcResult.message || "Failed to commit order transaction.",
    });
  }

  return {
    success: true,
    order_id: rpcResult.order_id,
    name: rpcResult.name || "",
    message: rpcResult.message || "Order registered successfully.",
  };
});
