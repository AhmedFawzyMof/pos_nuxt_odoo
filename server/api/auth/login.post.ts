import { defineEventHandler, readBody } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.username || !body.password) {
    return {
      success: false,
      error:
        "جميع الحقول (رابط الخادم، قاعدة البيانات، اسم المستخدم، كلمة المرور) مطلوبة.",
    };
  }

  const client = connectToOdoo(body.username, body.password);

  const [err, uid] = await tryCatch(client.connect());

  if (err) {
    return {
      success: false,
      error: err.message,
    };
  }

  const [userErr, userDetailsList] = await tryCatch(
    client.read<any>(
      "res.users",
      [Number(uid)],
      ["name", "company_id", "company_ids", "groups_id"],
    ),
  );

  if (userErr) {
    return {
      success: false,
      error: userErr.message,
    };
  }

  if (!userDetailsList || userDetailsList.length === 0) {
    return {
      success: false,
      error: "المستخدم غير موجود",
    };
  }
  const groupIds = userDetailsList[0].groups_id || [];

  let userPermissions: any = [];

  if (groupIds.length > 0) {
    const [groupError, groupRecords] = await tryCatch(
      client.read("res.groups", groupIds, ["name", "full_name", "category_id"]),
    );

    if (!groupError) {
      userPermissions = groupRecords.map((g: any) => ({
        id: g.id,
        name: g.name,
        fullName: g.full_name,
      }));
    }
    console.warn("Could not read permission groups:", groupError);
  }

  const [companyErr, companyDetailsList] = await tryCatch(
    client.read<any>("res.company", userDetailsList[0].company_ids, ["name"]),
  );

  if (companyErr) {
    return {
      success: false,
      error: companyErr.message,
    };
  }

  const allowedCompanies = (companyDetailsList || []).map((company: any) => ({
    id: company.id,
    name: company.name,
  }));

  const primaryCompanyId = userDetailsList[0].company_id[0];

  await setUserSession(event, {
    user: {
      id: uid,
      name: userDetailsList[0].name,
    },
    odooPassword: body.password,
    odooUsername: body.username,
  });

  return {
    success: true,
    user: {
      id: uid,
      name: userDetailsList[0].name,
      allowedCompanies,
      primaryCompanyId,
      userPermissions,
    },
  };
});
