import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const billId = query.id as string;
  if (!billId) {
    throw createError({ statusCode: 400, statusMessage: "معرف الفاتورة مطلوب" });
  }

  const odoo = await getOdooClient(event);
  const [rpcErr, result] = await tryCatch(
      odoo.execute_kw("vendor.bill.api", "get_vendor_bill_detail", [
        [billId],
      ]),
    );
  if (rpcErr) throw rpcErr;
  return result;
});
