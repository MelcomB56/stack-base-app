import { auth } from "@/auth";
import { apiError } from "@/lib/server-utils";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "SUPER_ADMIN")) return null;
  return session;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return apiError("Nicht autorisiert", 403);

  const { issuer } = await req.json().catch(() => ({}));
  if (!issuer || typeof issuer !== "string") return apiError("Issuer fehlt");

  try {
    const url = `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return Response.json({ ok: false, error: `HTTP ${res.status}` });
    const data = await res.json();
    if (!data.issuer || !data.authorization_endpoint) {
      return Response.json({ ok: false, error: "Ungültiges OIDC-Discovery-Dokument" });
    }
    return Response.json({ ok: true, issuer: data.issuer, authEndpoint: data.authorization_endpoint });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : "Verbindung fehlgeschlagen" });
  }
}
