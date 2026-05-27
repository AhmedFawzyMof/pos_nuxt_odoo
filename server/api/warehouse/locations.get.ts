import { defineEventHandler } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    return { success: false, error: "not authenticated" };
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  const [connectErr] = await tryCatch(odoo.connect());
  if (connectErr) {
    return {
      success: false,
      error: `Connection failed: ${connectErr.message}`,
    };
  }

  const [err, rawLocations] = await tryCatch(
    odoo.execute_kw("warehouse.location.api", "get_locations_with_capacity", [
      [],
    ]),
  );

  if (err) {
    return {
      success: false,
      error: `Failed to fetch locations: ${err.message}`,
    };
  }

  return {
    success: true,
    data: rawLocations as any[],
  };
});
