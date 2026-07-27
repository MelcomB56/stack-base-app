import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, slugify } from "@/lib/utils";
import { updateCategorySchema } from "@/lib/validations/category";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const category = await db.category.findUnique({ where: { id } });
  if (!category) return apiError("Kategorie nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.name && parsed.data.name !== category.name) {
    data.slug = slugify(parsed.data.name);
  }

  const updated = await db.category.update({ where: { id }, data });
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const count = await db.appCategory.count({ where: { categoryId: id } });
  if (count > 0)
    return apiError(`Kategorie wird von ${count} App(s) verwendet`, 409);

  await db.category.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
