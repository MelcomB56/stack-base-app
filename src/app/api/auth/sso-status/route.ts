import { db } from "@/lib/db";

// Öffentlicher Endpunkt — kein Auth erforderlich (Login-Seite braucht ihn)
export async function GET() {
  const rows = await db.systemSetting.findMany({
    where: { key: { in: ["authentik_enabled", "authentik_issuer", "authentik_client_id", "authentik_label"] } },
  });
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const enabled =
    s.authentik_enabled === "true" && !!s.authentik_issuer && !!s.authentik_client_id;

  return Response.json({
    authentikEnabled: enabled,
    authentikLabel: s.authentik_label || "Authentik",
  });
}
