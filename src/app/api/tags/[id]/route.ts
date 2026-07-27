import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { updateTagSchema } from "@/lib/validations/tag";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const tag = await db.tag.findUnique({ where: { id } });
  if (!tag) return apiError("Tag nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = updateTagSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const updated = await db.tag.update({ where: { id }, data: parsed.data });
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const tag = await db.tag.findUnique({ where: { id } });
  if (!tag) return apiError("Tag nicht gefunden", 404);

  await db.tag.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
