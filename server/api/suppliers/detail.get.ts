import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const supplierId = query.id as string;
  if (!supplierId) {
    throw createError({ statusCode: 400, statusMessage: "معرف المورد مطلوب" });
  }

  const odoo = await getOdooClient(event);
  const [rpcErr, result] = await tryCatch(
      odoo.execute_kw("res.partner", "get_supplier_detail", [
        [supplierId],
      ]),
    );
  if (rpcErr) throw rpcErr;
  return result;
});
