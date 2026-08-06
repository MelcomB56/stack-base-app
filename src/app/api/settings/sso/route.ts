import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";

const SSO_KEYS = [
  "authentik_enabled",
  "authentik_issuer",
  "authentik_client_id",
  "authentik_client_secret",
  "authentik_label",
  "authentik_default_role",
] as const;

type SsoKey = (typeof SSO_KEYS)[number];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return null;
  }
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) return apiError("Nicht autorisiert", 403);

  const rows = await db.systemSetting.findMany({ where: { key: { in: [...SSO_KEYS] } } });
  const map: Record<string, string> = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  // Secret immer maskiert ausliefern
  if (map.authentik_client_secret) map.authentik_client_secret = "••••••••";

  return Response.json(map);
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return apiError("Nicht autorisiert", 403);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return apiError("Ungültige Anfrage");

  for (const key of SSO_KEYS) {
    if (!(key in body)) continue;
    const value = body[key as SsoKey] as string | null | undefined;

    if (value === null || value === "" || value === undefined) {
      await db.systemSetting.deleteMany({ where: { key } });
    } else {
      // Secret-Platzhalter (Bullets) nicht zurückschreiben
      if (key === "authentik_client_secret" && /^[•]+$/.test(value)) continue;
      await db.systemSetting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      });
    }
  }

  return new Response(null, { status: 204 });
}
