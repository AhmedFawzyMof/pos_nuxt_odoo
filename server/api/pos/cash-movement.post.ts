import { defineEventHandler, readBody, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const sessionId = parseInt(body.session_id as string, 10);
  const amount = parseFloat(body.amount as string) || 0;
  const reason = String(body.reason || "").trim();

  if (!sessionId || amount === 0 || !reason) {
    throw createError({
      statusCode: 400,
      statusMessage: "session_id, amount, and reason are required",
    });
  }

  const odoo = await getOdooClient(event);

  const [rpcErr, rpcResult] = await tryCatch(
    odoo.execute_kw("pos.session", "control_cash_movement_rpc", [
      [sessionId, amount, reason],
    ]),
  );

  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `RPC failed: ${rpcErr.message}`,
    });
  }

  if (rpcResult.status === "error") {
    throw createError({
      statusCode: 400,
      statusMessage: rpcResult.message || "Cash movement failed",
    });
  }

  return {
    success: true,
    new_balance: rpcResult.current_total_cash ?? 0,
    message: rpcResult.message || "Cash movement recorded successfully",
  };
});
