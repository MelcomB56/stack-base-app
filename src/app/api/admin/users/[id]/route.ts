import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin, isSuperAdmin } from "@/lib/rbac";
import { apiError } from "@/lib/server-utils";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) return apiError("Nicht autorisiert", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { name, email, password, role, customRoleIds } = body as {
    name?: string; email?: string; password?: string;
    role?: string; customRoleIds?: string[];
  };

  const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return apiError("Nutzer nicht gefunden", 404);

  // Nur SUPER_ADMIN darf andere SUPER_ADMINs oder die SUPER_ADMIN-Rolle vergeben
  if (!isSuperAdmin(session)) {
    if (target.role === "SUPER_ADMIN") return apiError("Keine Berechtigung", 403);
    if (role === "SUPER_ADMIN") return apiError("Keine Berechtigung", 403);
  }

  const data: Record<string, unknown> = {};
  if (name?.trim())  data.name  = name.trim();
  if (email?.trim()) data.email = email.trim().toLowerCase();
  if (role)          data.role  = role;
  if (password?.trim()) data.passwordHash = await bcrypt.hash(password.trim(), 12);

  await db.$transaction(async (tx) => {
    if (Object.keys(data).length) await tx.user.update({ where: { id }, data });
    if (customRoleIds !== undefined) {
      await tx.roleAssignment.deleteMany({ where: { userId: id } });
      if (customRoleIds.length) {
        await tx.roleAssignment.createMany({
          data: customRoleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
    }
  });

  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) return apiError("Nicht autorisiert", 403);

  const { id } = await params;

  // Eigenen Account nicht löschbar
  if (session!.user!.id === id) return apiError("Eigenen Account nicht löschbar");

  const target = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return apiError("Nutzer nicht gefunden", 404);

  if (target.role === "SUPER_ADMIN" && !isSuperAdmin(session)) {
    return apiError("Keine Berechtigung", 403);
  }

  await db.user.delete({ where: { id } });
  return Response.json({ ok: true });
}
