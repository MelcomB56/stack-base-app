import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/rbac";
import { apiError } from "@/lib/server-utils";
import { ALL_PERMISSIONS } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) return apiError("Nicht autorisiert", 403);

  const { id } = await params;
  const role = await db.customRole.findUnique({ where: { id } });
  if (!role) return apiError("Rolle nicht gefunden", 404);

  const body = await req.json().catch(() => ({}));
  const { name, description, permissions, color } = body as {
    name?: string; description?: string; permissions?: string[]; color?: string;
  };

  const data: Record<string, unknown> = {};
  if (name?.trim()) data.name = name.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (color?.trim()) data.color = color.trim();
  if (permissions !== undefined) {
    data.permissions = permissions.filter((p) => p in ALL_PERMISSIONS);
  }
  data.updatedAt = new Date();

  await db.customRole.update({ where: { id }, data });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) return apiError("Nicht autorisiert", 403);

  const { id } = await params;
  const role = await db.customRole.findUnique({ where: { id }, select: { isSystem: true } });
  if (!role) return apiError("Rolle nicht gefunden", 404);
  if (role.isSystem) return apiError("Systemrollen können nicht gelöscht werden");

  await db.customRole.delete({ where: { id } });
  return Response.json({ ok: true });
}
