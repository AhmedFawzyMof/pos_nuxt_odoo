import { defineEventHandler, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();

    const taxes = await odoo.searchRead(
      "account.tax",
      [["type_tax_use", "=", "sale"], ["amount", ">", 0]],
      ["id", "name", "amount", "amount_type", "price_include"],
      1,
    );

    if (!taxes || taxes.length === 0) {
      return { success: true, tax: null };
    }

    return {
      success: true,
      tax: {
        id: taxes[0].id,
        name: taxes[0].name,
        amount: taxes[0].amount,
        amount_type: taxes[0].amount_type || "percent",
        price_include: taxes[0].price_include || false,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في جلب الضريبة الافتراضية: ${error.message}`,
    });
  }
});
