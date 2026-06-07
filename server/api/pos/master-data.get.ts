import { defineEventHandler, getQuery, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const query = getQuery(event);
  const configId = query.config_id
    ? parseInt(query.config_id as string, 10)
    : null;

  const page = Math.max(1, parseInt((query.page as string) || "1", 10));
  const limit = Math.max(1, parseInt((query.limit as string) || "28", 10));
  const categoryId = query.category_id
    ? parseInt(query.category_id as string, 10)
    : null;

  const locationId = query.location_id
    ? parseInt(query.location_id as string, 10)
    : null;

  if (!configId) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Bad Request: config_id is required to fetch catalog environments.",
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
      statusMessage: `Failed to connect to server: ${connectErr.message}`,
    });
  }

  const [rpcErr, rpcResult] = await tryCatch(
    odoo.execute_kw("pos.config", "get_pos_master_data_rpc", [
      [configId, page, limit, categoryId, locationId],
    ]),
  );

  if (rpcErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `Master Catalog RPC Failed: ${rpcErr.message}`,
    });
  }

  if (rpcResult.status === "error") {
    throw createError({
      statusCode: 400,
      statusMessage:
        rpcResult.message || "Failed to load point-of-sale catalog.",
    });
  }

  const odooData = rpcResult.data || {};
  const pagination = odooData.pagination || {};

  const [locErr, locData] = await tryCatch(
    odoo.searchRead(
      "stock.location",
      [["usage", "=", "internal"]],
      ["id", "name"],
    ),
  );

  const [taxErr, taxData] = await tryCatch(
    odoo.searchRead(
      "account.tax",
      [["type_tax_use", "=", "sale"]],
      ["id", "name", "amount", "amount_type", "price_include"],
    ),
  );

  const locationMap: Record<number, string> = {};
  if (!locErr && locData) {
    for (const loc of locData as any[]) {
      locationMap[loc.id] = loc.name;
    }
  }

  const taxMap: Record<number, { id: number; name: string; amount: number; amount_type?: string; price_include?: boolean }> = {};
  if (!taxErr && taxData) {
    for (const tax of taxData as any[]) {
      taxMap[tax.id] = tax;
    }
  }

  const categoryCountMap: Record<number, number> = {};
  if (odooData.products && Array.isArray(odooData.products)) {
    for (const p of odooData.products) {
      const categoriesAssigned = p.pos_categories || [];
      for (const cat of categoriesAssigned) {
        if (cat.id) {
          categoryCountMap[cat.id] = (categoryCountMap[cat.id] || 0) + 1;
        }
      }
    }
  }

  return {
    success: true,
    products: {
      data: (odooData.products || []).map((p: any) => ({
        id: p.id,
        name: p.display_name,
        display_name: p.display_name,
        barcode: p.barcode || "",
        list_price: p.lst_price || 0,
        weight: p.weight || 0,
        to_weight: p.to_weight || false,
        type: p.type || "product",
        pos_categories: p.pos_categories || [],
        taxes_id: (p.taxes_id || []).filter((id: number) => id > 0),
        taxes: (p.taxes_id || [])
          .filter((id: number) => id > 0)
          .map((id: number) => taxMap[id])
          .filter(Boolean),
        stock_by_location: Object.entries(p.stock_by_location || {}).map(
          ([locId, qty]) => ({
            location_id: parseInt(locId, 10),
            location_name: locationMap[parseInt(locId, 10)] || `مخزن #${locId}`,
            quantity: Number(qty) || 0,
          }),
        ),
      })),
      totalItems: pagination.total_items || 0,
      totalPages: pagination.total_pages || 1,
      currentPage: pagination.current_page || page,
      itemsPerPage: pagination.limit || limit,
    },
    categories: (odooData.categories || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      parent_id: cat.parent_id
        ? { id: cat.parent_id[0], name: cat.parent_id[1] }
        : null,
      productsCount: categoryCountMap[cat.id] || 0,
    })),
    locations: locErr
      ? []
      : (locData || []).map((loc: any) => ({
          id: loc.id,
          name: loc.name,
        })),
    paymentMethods: (odooData.payment_methods || []).map((pm: any) => ({
      id: pm.id,
      name: pm.name,
      is_cash_count: pm.is_cash_count,
    })),
    defaultPricelistId: odooData.default_pricelist_id || null,
  };
});
