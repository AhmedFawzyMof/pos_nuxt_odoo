import { defineEventHandler, readBody } from "h3";
import { JsonClient } from "../../utils/json_client";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.baseUrl || !body.db || !body.username || !body.password) {
    return {
      success: false,
      error: "جميع الحقول (رابط الخادم، قاعدة البيانات، اسم المستخدم، كلمة المرور) مطلوبة.",
    };
  }

  try {
    const client = new JsonClient({
      baseUrl: body.baseUrl,
      db: body.db,
      username: body.username,
      password: body.password,
    });

    const uid = await client.login();

    // Default safe fallback metadata in case Odoo models are restricted or custom
    let userName = body.username;
    let allowedCompanies = [{ id: 1, name: "الشركة الرئيسية" }];
    let primaryCompanyId = 1;

    try {
      const userDetailsList = await client.executeKw(uid, "res.users", "read", [
        [uid],
        ["name", "company_id", "company_ids"],
      ]);

      if (userDetailsList && userDetailsList[0]) {
        const userDetails = userDetailsList[0];
        userName = userDetails.name || body.username;

        const allowedCompanyIds = userDetails.company_ids || [];
        if (allowedCompanyIds.length > 0) {
          try {
            const fetchedCompanies = await client.executeKw(uid, "res.company", "read", [
              allowedCompanyIds,
              ["name"],
            ]);
            if (fetchedCompanies && fetchedCompanies.length > 0) {
              allowedCompanies = fetchedCompanies.map((c: any) => ({
                id: c.id,
                name: c.name,
              }));
            }
          } catch (compError) {
            console.warn("Could not read res.company models, falling back to primary company:", compError);
            if (userDetails.company_id) {
              allowedCompanies = [{
                id: userDetails.company_id[0],
                name: userDetails.company_id[1],
              }];
            }
          }
        } else if (userDetails.company_id) {
          allowedCompanies = [{
            id: userDetails.company_id[0],
            name: userDetails.company_id[1],
          }];
        }

        primaryCompanyId = userDetails.company_id ? userDetails.company_id[0] : (allowedCompanies[0]?.id || 1);
      }
    } catch (profileError) {
      console.warn("Could not read res.users model, returning authenticated uid with default company context:", profileError);
    }

    return {
      success: true,
      user: {
        id: uid,
        name: userName,
        allowedCompanies,
        primaryCompanyId,
      },
    };
  } catch (error: any) {
    console.error("[Auth API Error]:", error);
    return {
      success: false,
      error: error.message || "فشل الاتصال بخادم Odoo أو بيانات الاعتماد خاطئة.",
    };
  }
});
