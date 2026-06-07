import { defineEventHandler, readBody, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);
  const name = String(body.name ?? "").trim();

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "اسم الجهاز مطلوب",
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
      statusMessage: `فشل الاتصال بالخادم: ${connectErr.message}`,
    });
  }

  // --- CLEAN FIX HERE ---
  // Call your custom Python RPC method directly instead of rebuilding it in JS
  // Wrapping 'name' inside an inner array avoids the string-unpacking TypeError
  const [rpcErr, rpcResult] = await tryCatch(
    odoo.execute_kw("pos.config", "create_new_register_rpc", [[name]]),
  );

  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل عطل في الخادم: ${rpcErr.message}`,
    });
  }

  // Handle the custom JSON structures your Python addon returns
  if (rpcResult.status === "error") {
    throw createError({
      statusCode: 400,
      statusMessage: rpcResult.message,
    });
  }

  return {
    success: true,
    config_id: rpcResult.id,
    name,
    message: rpcResult.message,
  };
});
