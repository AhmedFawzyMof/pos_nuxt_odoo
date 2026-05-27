import { defineEventHandler, readBody } from "h3";
import { connectToOdoo } from "~~/server/utils/client";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  try {
    await odoo.connect();

    // Find the available image field in Odoo dynamically
    let imageField = "image_128";
    try {
      const fields: any = await odoo.execute_kw("pos.category", "fields_get", [
        [],
        ["image_128", "image", "image_medium"],
      ]);
      if (fields.image_128) {
        imageField = "image_128";
      } else if (fields.image) {
        imageField = "image";
      } else if (fields.image_medium) {
        imageField = "image_medium";
      }
    } catch (e) {
      console.warn("fields_get failed, defaulting to image_128", e);
    }

    const categoryValues: any = {
      name: body.name,
      sequence: isNaN(Number(body.sequence)) ? 0 : Number(body.sequence),
      parent_id: body.parent_id ? Number(body.parent_id) : false,
    };

    if (body.image !== undefined) {
      if (body.image) {
        const match = body.image.match(/^data:image\/\w+;base64,(.+)$/);
        categoryValues[imageField] = match ? match[1] : body.image;
      } else {
        categoryValues[imageField] = false;
      }
    }

    const isEditMode = !!body.id;
    let categoryId: number;

    if (isEditMode) {
      categoryId = Number(body.id);
      await odoo.execute_kw("pos.category", "write", [
        [categoryId],
        categoryValues,
      ]);
    } else {
      categoryId = await odoo.execute_kw("pos.category", "create", [
        [categoryValues],
      ]);
    }

    return {
      success: true,
      message: isEditMode ? "تم تحديث القسم بنجاح" : "تم إنشاء القسم بنجاح",
      id: categoryId,
    };
  } catch (error: any) {
    console.error("Odoo Category Save Error: ", error);
    throw createError({
      statusCode: 500,
      statusMessage: `فشل في حفظ القسم في أودو: ${error.message}`,
    });
  }
});
