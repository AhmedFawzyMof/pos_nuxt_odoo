import { defineEventHandler, getQuery, createError } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const paramsPayload = {
    page: (query.page as string) || "1",
    search: (query.search as string) || "",
    type: (query.type as string) || "الكل",
  };

  const odoo = await getOdooClient(event);

  const [rpcErr, result] = await tryCatch(
    odoo.execute_kw("res.partner", "get_pos_frontend_customers", [
      [],
      { params: paramsPayload },
    ]),
  );

  if (rpcErr) throw rpcErr;

  return result;
});
