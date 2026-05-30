import { defineEventHandler, readBody } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  const [connectErr] = await tryCatch(odoo.connect());
  if (connectErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `فشل الاتصال بأودو: ${connectErr.message}`,
    });
  }

  const body = await readBody(event);
  if (!body) {
    throw createError({ statusCode: 400, statusMessage: "بيانات العميل مطلوبة" });
  }

  const partnerVals: Record<string, any> = {};
  if (body.name) partnerVals.name = body.name;
  if (body.email) partnerVals.email = body.email;
  if (body.phone) {
    partnerVals.mobile = body.phone;
    partnerVals.phone = body.phone;
  }
  if (body.street) partnerVals.street = body.street;
  if (body.city) partnerVals.city = body.city;
  if (body.vat) partnerVals.vat = body.vat;
  if (body.is_company !== undefined) partnerVals.is_company = body.is_company;
  if (body.company_type) partnerVals.company_type = body.company_type;

  let partnerId: number;

  if (body.id) {
    // Update existing partner
    const [writeErr] = await tryCatch(
      odoo.execute_kw("res.partner", "write", [[body.id, partnerVals]]),
    );
    if (writeErr) {
      throw createError({
        statusCode: 500,
        statusMessage: `فشل في تحديث بيانات العميل: ${writeErr.message}`,
      });
    }
    partnerId = body.id;
  } else {
    // Create new partner
    const [createErr, newId] = await tryCatch(
      odoo.execute_kw("res.partner", "create", [[partnerVals]]),
    );
    if (createErr) {
      throw createError({
        statusCode: 500,
        statusMessage: `فشل في إنشاء العميل: ${createErr.message}`,
      });
    }
    partnerId = newId as number;
  }

  // Try updating loyalty card if tier or points provided
  if (body.tier || body.points !== undefined) {
    // Check if loyalty card model exists
    const [checkErr, modelExists] = await tryCatch(
      odoo.execute_kw("loyalty.card", "search_count", [[["partner_id", "=", partnerId]]]),
    );

    if (!checkErr && (modelExists as number) > 0 && body.points !== undefined) {
      const [cardsErr, existingCards] = await tryCatch(
        odoo.execute_kw("loyalty.card", "search_read", [
          [[["partner_id", "=", partnerId]]],
          { fields: ["id", "points"] },
        ]),
      );
      if (!cardsErr && existingCards) {
        for (const card of existingCards as any[]) {
          await tryCatch(
            odoo.execute_kw("loyalty.card", "write", [[card.id, { points: body.points }]]),
          );
        }
      }
    }
  }

  return {
    success: true,
    id: partnerId,
    message: body.id ? "تم تحديث بيانات العميل بنجاح" : "تم إنشاء العميل بنجاح",
  };
});
