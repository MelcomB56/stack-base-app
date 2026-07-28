import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, slugify } from "@/lib/server-utils";
import { updateTechnologySchema } from "@/lib/validations/stack";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const tech = await db.technology.findUnique({ where: { id } });
  if (!tech) return apiError("Technologie nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = updateTechnologySchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.logoUrl === "") data.logoUrl = null;
  if (parsed.data.websiteUrl === "") data.websiteUrl = null;
  if (parsed.data.name && parsed.data.name !== tech.name) {
    data.slug = slugify(parsed.data.name);
  }

  const updated = await db.technology.update({ where: { id }, data });
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const count = await db.appTechnology.count({ where: { technologyId: id } });
  if (count > 0)
    return apiError(`Technologie wird von ${count} App(s) verwendet`, 409);

  await db.technology.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
