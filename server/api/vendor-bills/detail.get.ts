import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const query = getQuery(event);
  const billId = query.id as string;
  if (!billId) {
    throw createError({ statusCode: 400, statusMessage: "معرف الفاتورة مطلوب" });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();
    const [rpcErr, result] = await tryCatch(
      odoo.execute_kw("vendor.bill.api", "get_vendor_bill_detail", [
        [billId],
      ]),
    );
    if (rpcErr) throw rpcErr;
    return result;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في جلب تفاصيل الفاتورة: ${error.message}`,
    });
  }
});
