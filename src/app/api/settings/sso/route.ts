import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { guard } from "@/lib/rbac";

const SSO_KEYS = [
  "authentik_enabled",
  "authentik_issuer",
  "authentik_client_id",
  "authentik_client_secret",
  "authentik_label",
  "authentik_default_role",
] as const;

type SsoKey = (typeof SSO_KEYS)[number];

export async function GET() {
  const session = await auth();
  const err = await guard(session, "settings.read");
  if (err) return err;

  const rows = await db.systemSetting.findMany({ where: { key: { in: [...SSO_KEYS] } } });
  const map: Record<string, string> = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  // Secret immer maskiert ausliefern
  if (map.authentik_client_secret) map.authentik_client_secret = "••••••••";

  return Response.json(map);
}

export async function PATCH(req: Request) {
  const session = await auth();
  const errP = await guard(session, "settings.update");
  if (errP) return errP;

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
