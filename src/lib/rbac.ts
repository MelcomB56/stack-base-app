import "server-only";
import { cache } from "react";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type Session } from "next-auth";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "DEVELOPER" | "TESTER" | "CUSTOMER" | "GUEST";

/** Collects all permissions from a user's custom role assignments. Cached per request. */
export const getUserPermissions = cache(async (userId: string): Promise<Set<string>> => {
  const assignments = await db.roleAssignment.findMany({
    where: { userId },
    include: { role: { select: { permissions: true } } },
  });
  const perms = new Set<string>();
  for (const { role } of assignments) {
    for (const p of role.permissions) perms.add(p);
  }
  return perms;
});

/**
 * Check whether a user may perform a given action.
 * - SUPER_ADMIN / ADMIN → always true
 * - Everyone else → must have the permission in one of their custom roles
 */
export async function canDo(
  session: Session | null,
  permission: string,
): Promise<boolean> {
  if (!session?.user?.id) return false;
  const role = (session.user as { role?: string }).role as UserRole | undefined;
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const perms = await getUserPermissions(session.user.id);
  return perms.has(permission);
}

/** Synchronous check — only covers SUPER_ADMIN / ADMIN, no DB lookup. */
export function isAdmin(session: Session | null): boolean {
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isSuperAdmin(session: Session | null): boolean {
  return (session?.user as { role?: string } | undefined)?.role === "SUPER_ADMIN";
}

/**
 * Route-Guard: gibt 401/403 NextResponse zurück wenn nicht erlaubt, sonst null.
 * Verwendung: const err = await guard(session, "apps.read"); if (err) return err;
 */
export async function guard(
  session: Session | null,
  permission: string,
): Promise<NextResponse | null> {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }
  const allowed = await canDo(session, permission);
  if (!allowed) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }
  return null;
}
