import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const query = getQuery(event);
  const paramsPayload = {
    page: (query.page as string) || "1",
    search: (query.search as string) || "",
    status: (query.status as string) || "all",
  };

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();
    const [rpcErr, result] = await tryCatch(
      odoo.execute_kw("res.partner", "get_pos_suppliers", [
        [paramsPayload],
      ]),
    );
    if (rpcErr) throw rpcErr;
    return result;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في جلب بيانات الموردين: ${error.message}`,
    });
  }
});
