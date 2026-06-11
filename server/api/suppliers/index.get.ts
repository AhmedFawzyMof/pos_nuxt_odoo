import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const paramsPayload = {
    page: (query.page as string) || "1",
    search: (query.search as string) || "",
    status: (query.status as string) || "all",
  };

  const odoo = await getOdooClient(event);
  const [rpcErr, result] = await tryCatch(
      odoo.execute_kw("res.partner", "get_pos_suppliers", [
        [paramsPayload],
      ]),
    );
  if (rpcErr) throw rpcErr;
  return result;
});
