import { defineEventHandler, createError } from "h3";
import { getOdooClient } from "~~/server/utils/odooClient";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const odoo = await getOdooClient(event);

  const session = await getUserSession(event);
  const uid = (session.user as any).id;

  const [userErr, userData] = await tryCatch(
    odoo.read("res.users", uid, [
      "name",
      "login",
      "email",
      "lang",
      "tz",
      "partner_id",
      "groups_id",
    ]),
  );
  if (userErr) throw userErr;

  const user: any = userData?.[0];
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  const partnerId = (user as any).partner_id?.[0];
  let avatarBase64 = null;
  if (partnerId) {
    const [avatarErr, avatarData] = await tryCatch(
      odoo.read("res.partner", partnerId, ["image_1920"]),
    );
    if (!avatarErr && (avatarData as any)[0]?.image_1920) {
      avatarBase64 = (avatarData as any)[0].image_1920;
    }
  }

  const [groupsErr, groupsData] = await tryCatch(
    odoo.searchRead(
      "res.groups",
      [["id", "in", user.groups_id || []]],
      ["id", "name", "category_id"],
    ),
  );
  const groups = groupsErr
    ? []
    : (groupsData || []).filter((g: any) => g.category_id);

  return {
    success: true,
    data: {
      id: user.id,
      name: user.name,
      login: user.login,
      email: user.email,
      lang: user.lang,
      tz: user.tz,
      partnerId,
      avatar: avatarBase64,
      groups,
    },
  };
});
