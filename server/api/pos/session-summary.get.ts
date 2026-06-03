import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const query = getQuery(event);
  const sessionId = parseInt(String(query.session_id ?? ""), 10);

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
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to connect: ${connectErr.message}`,
    });
  }

  const [rpcErr, rpcResult] = await tryCatch(
    odoo.execute_kw("pos.session", "get_session_summary_rpc", [
      [sessionId],
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
      statusMessage: rpcResult.message || "Failed to get session summary",
    });
  }

  const financials = rpcResult.financials || {};

  return {
    success: true,
    summary: {
      session_name: rpcResult.name || "",
      orders_count: financials.total_orders_count || 0,
      total_sales: financials.total_payments_amount || 0,
      opening_cash: financials.cash_register_balance_start || 0,
      cash_balance: financials.cash_register_balance_end || 0,
      cash_movements: rpcResult.cash_movements || [],
    },
  };
});
