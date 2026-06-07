import { defineEventHandler, readBody, createError } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();

    const body = await readBody(event);
    const uid = session.user.id;
    const userVals: Record<string, any> = {};

    if (body.lang) {
      userVals.lang = body.lang;
    }
    if (body.tz) {
      userVals.tz = body.tz;
    }

    if (Object.keys(userVals).length > 0) {
      const [writeErr] = await tryCatch(
        odoo.execute_kw("res.users", "write", [[[uid], userVals]]),
      );
      if (writeErr) throw writeErr;
    }

    if (body.avatar && body.partnerId) {
      const [avatarErr] = await tryCatch(
        odoo.execute_kw("res.partner", "write", [[[body.partnerId], { image_1920: body.avatar }]]),
      );
      if (avatarErr) throw avatarErr;
    }

    return { success: true, message: "Profile updated successfully" };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update profile: ${error.message}`,
    });
  }
});
