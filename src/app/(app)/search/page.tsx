import { db } from "@/lib/db";
import { AppCard } from "@/components/apps/AppCard";
import { Search } from "lucide-react";

interface SearchParams {
  q?: string;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
        include: {
          categories: { include: { category: true } },
        },
        orderBy: { name: "asc" },
        take: 50,
      })
    : [];

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Search size={18} className="text-primary" />
          Suche
        </h1>
        {query ? (
          <p className="text-sm text-muted-foreground mt-0.5">
            {results.length} Ergebnis{results.length !== 1 ? "se" : ""} für{" "}
            <span className="text-foreground font-medium">&bdquo;{query}&ldquo;</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-0.5">Gib oben einen Suchbegriff ein.</p>
        )}
      </div>

      {query && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Search size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Keine Apps gefunden.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {results.map((app) => (
            <AppCard
              key={app.id}
              app={{
                ...app,
                logoUrl: app.logoUrl ?? null,
                urlProd: app.urlProd ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
