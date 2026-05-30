// server/api/customer-details.get.ts
import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const query = getQuery(event);
  const customerId = query.id as string;

  if (!customerId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing customer id",
    });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();

    const [rpcErr, result] = await tryCatch(
      odoo.execute_kw("res.partner", "get_customer_detailed_ledger", [
        [],
        { params: { customer_id: customerId } },
      ]),
    );

    if (rpcErr) throw rpcErr;
    return result;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في جلب تفاصيل السجل المخزني للعميل: ${error.message}`,
    });
  }
});
