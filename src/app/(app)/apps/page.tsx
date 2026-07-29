import { db } from "@/lib/db";
import { AppCard } from "@/components/apps/AppCard";
import { AppStatus } from "@/generated/prisma/client";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

interface SearchParams {
  q?: string;
  status?: string;
  categoryId?: string;
  page?: string;
}

async function getApps(params: SearchParams) {
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const limit = 24;
  const q = params.q?.trim();
  const status = params.status as AppStatus | undefined;
  const categoryId = params.categoryId;

  const where = {
    deletedAt: null as null,
    ...(status && Object.values(AppStatus).includes(status) ? { status } : {}),
    ...(categoryId ? { categories: { some: { categoryId } } } : {}),
    ...(q
      ? { OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { shortDesc: { contains: q, mode: "insensitive" as const } },
          ] }
      : {}),
  };

  const [apps, total, categories] = await Promise.all([
    db.app.findMany({
      where,
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.app.count({ where }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Letzter Healthcheck pro App (eine Query statt N)
  const latestChecks = await db.healthCheck.findMany({
    where: { appId: { in: apps.map((a) => a.id) } },
    orderBy: { checkedAt: "desc" },
    distinct: ["appId"],
    select: { appId: true, status: true },
  });
  const healthMap = Object.fromEntries(latestChecks.map((c) => [c.appId, c.status]));

  return { apps, total, page, limit, categories, healthMap };
}

const STATUS_OPTIONS = [
  { value: "", label: "Alle Status" },
  { value: "PRODUCTION", label: "Produktion" },
  { value: "DEVELOPMENT", label: "Entwicklung" },
  { value: "TESTING", label: "Testing" },
  { value: "MAINTENANCE", label: "Wartung" },
  { value: "ARCHIVED", label: "Archiviert" },
];

export default async function AppsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { apps, total, page, limit, categories, healthMap } = await getApps(params);
  const pages = Math.ceil(total / limit);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0 }}>
            Apps
          </h1>
          <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>
            {total} App{total !== 1 ? "s" : ""} gesamt
          </p>
        </div>
        <Link href="/apps/new" style={{ textDecoration: "none" }}>
          <button
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#2563E8", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer" }}
          >
            <Plus size={14} />
            Neue App
          </button>
        </Link>
      </div>

      {/* Filterleiste */}
      <form method="GET">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={13} style={{ position: "absolute", left: 10, color: "#7A8BA6", pointerEvents: "none" }} />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="App suchen..."
              className="ds-input"
              style={{ paddingLeft: 30, width: 200 }}
            />
          </div>

          <select name="status" defaultValue={params.status ?? ""} className="ds-select" style={{ paddingRight: 28, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8BA6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {categories.length > 0 && (
            <select name="categoryId" defaultValue={params.categoryId ?? ""} className="ds-select" style={{ paddingRight: 28, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8BA6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
              <option value="">Alle Kategorien</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          <button type="submit" style={{ padding: "7px 14px", background: "#1A2640", color: "#EDF2F7", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #1E3050", cursor: "pointer" }}>
            Filtern
          </button>

          {(params.q || params.status || params.categoryId) && (
            <Link href="/apps" style={{ textDecoration: "none" }}>
              <button type="button" style={{ padding: "7px 14px", background: "transparent", color: "#7A8BA6", borderRadius: 8, fontSize: 13, border: "1px solid transparent", cursor: "pointer" }}>
                Zurücksetzen
              </button>
            </Link>
          )}
        </div>
      </form>

      {/* Grid */}
      {apps.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#7A8BA6" }}>Keine Apps gefunden.</p>
          <Link href="/apps/new" style={{ textDecoration: "none", marginTop: 12 }}>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#1A2640", color: "#EDF2F7", borderRadius: 8, fontSize: 13, border: "1px solid #1E3050", cursor: "pointer" }}>
              <Plus size={13} />
              Erste App anlegen
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={{ ...app, logoUrl: app.logoUrl ?? null, urlProd: app.urlProd ?? null }}
              healthStatus={healthMap[app.id] ?? null}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
          {page > 1 && (
            <Link href={`/apps?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`} style={{ textDecoration: "none" }}>
              <button style={{ padding: "6px 14px", background: "#111C2D", color: "#EDF2F7", borderRadius: 8, fontSize: 12, border: "1px solid #1E3050", cursor: "pointer" }}>
                ← Zurück
              </button>
            </Link>
          )}
          <span style={{ fontSize: 12, color: "#7A8BA6" }}>Seite {page} von {pages}</span>
          {page < pages && (
            <Link href={`/apps?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`} style={{ textDecoration: "none" }}>
              <button style={{ padding: "6px 14px", background: "#111C2D", color: "#EDF2F7", borderRadius: 8, fontSize: 12, border: "1px solid #1E3050", cursor: "pointer" }}>
                Weiter →
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
