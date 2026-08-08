import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/rbac";
import { apiError } from "@/lib/server-utils";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return apiError("Nicht autorisiert", 403);

  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      lastLoginAt: true,
      createdAt: true,
      passwordHash: true,
      roleAssignments: {
        select: {
          role: { select: { id: true, name: true, color: true } },
        },
      },
    },
  });

  return Response.json(users.map((u) => ({
    ...u,
    isLocalUser: !!u.passwordHash,
    passwordHash: undefined,
    customRoles: u.roleAssignments.map((a) => a.role),
    roleAssignments: undefined,
  })));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) return apiError("Nicht autorisiert", 403);

  const body = await req.json().catch(() => ({}));
  const { name, email, password, role = "GUEST", customRoleIds = [] } = body as {
    name?: string; email?: string; password?: string;
    role?: string; customRoleIds?: string[];
  };

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return apiError("Name, E-Mail und Passwort sind Pflichtfelder");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return apiError("E-Mail bereits vergeben", 409);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: role as never,
      roleAssignments: customRoleIds.length
        ? { create: customRoleIds.map((roleId) => ({ roleId })) }
        : undefined,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return Response.json(user, { status: 201 });
}
