import { db } from "@/lib/db";
import { AppCard } from "@/components/apps/AppCard";
import { Search } from "lucide-react";
import { requirePermission } from "@/lib/page-guard";

interface SearchParams { q?: string }

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requirePermission("apps.read");
  const { q } = await searchParams;
  const query = q?.trim();

  const results = query
    ? await db.app.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { shortDesc: { contains: query, mode: "insensitive" } },
            { longDesc: { contains: query, mode: "insensitive" } },
            { language: { contains: query, mode: "insensitive" } },
            { dockerImage: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { categories: { include: { category: true } } },
        orderBy: { name: "asc" },
        take: 50,
      })
    : [];

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Search size={18} style={{ color: "#2563E8" }} />
          Suche
        </h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>
          {query
            ? <>{results.length} Ergebnis{results.length !== 1 ? "se" : ""} für <span style={{ color: "#EDF2F7", fontWeight: 500 }}>„{query}"</span></>
            : "Gib oben einen Suchbegriff ein."}
        </p>
      </div>

      {query && results.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", textAlign: "center" }}>
          <Search size={32} style={{ color: "rgba(37,99,232,0.2)", marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: "#7A8BA6" }}>Keine Apps gefunden.</p>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {results.map((app) => (
            <AppCard
              key={app.id}
              app={{ ...app, logoUrl: app.logoUrl ?? null, urlProd: app.urlProd ?? null }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
