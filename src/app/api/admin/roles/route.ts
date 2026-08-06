import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/rbac";
import { apiError } from "@/lib/server-utils";
import { ALL_PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return apiError("Nicht autorisiert", 403);

  const roles = await db.customRole.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { assignments: true } } },
  });

  return Response.json(roles.map((r) => ({
    ...r,
    userCount: r._count.assignments,
    _count: undefined,
  })));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) return apiError("Nicht autorisiert", 403);

  const body = await req.json().catch(() => ({}));
  const { name, description, permissions = [], color = "#2563E8" } = body as {
    name?: string; description?: string; permissions?: string[]; color?: string;
  };

  if (!name?.trim()) return apiError("Name ist Pflichtfeld");

  // Validate permissions
  const validPerms = permissions.filter((p) => p in ALL_PERMISSIONS);

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const existing = await db.customRole.findFirst({ where: { OR: [{ name: name.trim() }, { slug }] } });
  if (existing) return apiError("Name bereits vergeben", 409);

  const role = await db.customRole.create({
    data: { id: crypto.randomUUID(), name: name.trim(), slug, description: description?.trim() || null, permissions: validPerms, color: color || "#2563E8" },
  });

  return Response.json(role, { status: 201 });
}
