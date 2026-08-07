import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canDo } from "@/lib/rbac";
import type { Session } from "next-auth";

/** Prüft Berechtigung für Server-Component-Pages. Redirects nach /unauthorized bei fehlendem Zugriff. */
export async function requirePermission(permission: string): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const allowed = await canDo(session, permission);
  if (!allowed) redirect("/unauthorized");
  return session;
}

/** Nur Auth-Check (für eigene Ressourcen wie Profil, Favoriten). */
export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}
