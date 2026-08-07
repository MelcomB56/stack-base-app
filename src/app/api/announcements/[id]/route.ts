import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";
import { apiError } from "@/lib/server-utils";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title:    z.string().min(1).max(200).optional(),
  content:  z.string().min(1).optional(),
  pinned:   z.boolean().optional(),
  audience: z.string().max(50).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  const err = await guard(session, "announcements.update");
  if (err) return err;

  const { id } = await params;
  const exists = await db.announcement.findUnique({ where: { id } });
  if (!exists) return apiError("Nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body ?? {});
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const updated = await db.announcement.update({ where: { id }, data: parsed.data });
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const errD = await guard(session, "announcements.delete");
  if (errD) return errD;

  const { id } = await params;
  await db.announcement.delete({ where: { id } }).catch(() => null);
  return new Response(null, { status: 204 });
}
