import { defineEventHandler } from "h3";
import { getAdminOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";
import { getDb } from "~~/server/db";

const locationTranslations: Record<string, string> = {
  "WH": "المستودع",
  "WH/Stock": "المستودع/المخزون",
  "Scrap": "الخردة",
  "Physical Locations": "المواقع الفعلية",
  "Inventory adjustment": "تسوية المخزون",
  "Production": "الإنتاج",
  "Partner Locations": "مواقع الشركاء",
  "Partner Locations/Vendors": "مواقع الشركاء / الموردين",
  "Partner Locations/Customers": "مواقع الشركاء / العملاء",
  "Virtual Locations": "المواقع الافتراضية",
  "Inter-company transit": "النقل بين الشركات",
};

export default defineEventHandler(async (event) => {
  const db = getDb();

  const existingCount = db.prepare("SELECT COUNT(*) as count FROM location_translations").get() as any;
  if (existingCount.count > 0) {
    return { translated: 0, message: "المواقع مترجمة بالفعل" };
  }

  const odoo = await getAdminOdooClient();

  const [err, rawLocations] = await tryCatch(
    odoo.execute_kw("stock.location", "search_read", [
      [],
      ["id", "name", "complete_name", "usage", "location_id"],
    ]),
  );

  if (err) {
    throw createError({
      statusCode: 500,
      message: `فشل في جلب المواقع: ${err.message}`,
    });
  }

  const locations = rawLocations as any[];
  let translatedCount = 0;

  const insertTranslation = db.prepare(
    "INSERT INTO location_translations (location_id, odoo_name, arabic_name) VALUES (?, ?, ?)",
  );

  for (const loc of locations) {
    const arabicName = locationTranslations[loc.name];
    if (!arabicName) continue;

    const vals: Record<string, any> = { name: arabicName };

    if (loc.complete_name === loc.name) {
      vals.complete_name = arabicName;
    }

    const [updateErr] = await tryCatch(
      odoo.execute_kw("stock.location", "write", [[[loc.id], vals]]),
    );

    if (updateErr) {
      console.warn(`Failed to translate location "${loc.name}" (id=${loc.id}): ${updateErr.message}`);
      continue;
    }

    insertTranslation.run(loc.id, loc.name, arabicName);
    translatedCount++;
  }

  return {
    translated: translatedCount,
    message:
      translatedCount > 0
        ? `تم ترجمة ${translatedCount} موقع`
        : "جميع المواقع مترجمة بالفعل",
  };
});
