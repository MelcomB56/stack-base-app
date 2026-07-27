import { db } from "@/lib/db";
import { AppCard } from "@/components/apps/AppCard";
import { AppStatus } from "@/generated/prisma/client";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { shortDesc: { contains: q, mode: "insensitive" as const } },
          ],
        }
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

  return { apps, total, page, limit, categories };
}

const STATUS_OPTIONS = [
  { value: "", label: "Alle Status" },
  { value: "PRODUCTION", label: "Produktion" },
  { value: "DEVELOPMENT", label: "Entwicklung" },
  { value: "TESTING", label: "Testing" },
  { value: "MAINTENANCE", label: "Wartung" },
  { value: "ARCHIVED", label: "Archiviert" },
];

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { apps, total, page, limit, categories } = await getApps(params);
  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apps</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} App{total !== 1 ? "s" : ""} gesamt
          </p>
        </div>
        <Link href="/apps/new">
          <Button size="sm" className="gap-1.5">
            <Plus size={14} />
            Neue App
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <form method="GET" className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="App suchen..."
            className="pl-8 pr-3 py-1.5 text-sm bg-card border border-border rounded-md w-56 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="px-3 py-1.5 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {categories.length > 0 && (
          <select
            name="categoryId"
            defaultValue={params.categoryId ?? ""}
            className="px-3 py-1.5 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Alle Kategorien</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <Button type="submit" size="sm" variant="secondary">
          Filtern
        </Button>
        {(params.q || params.status || params.categoryId) && (
          <Link href="/apps">
            <Button size="sm" variant="ghost">
              Zurücksetzen
            </Button>
          </Link>
        )}
      </form>

      {/* Grid */}
      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-sm">Keine Apps gefunden</p>
          <Link href="/apps/new" className="mt-3">
            <Button size="sm" variant="secondary" className="gap-1.5">
              <Plus size={14} />
              Erste App anlegen
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {apps.map((app) => (
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

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center gap-2 pt-2">
          {page > 1 && (
            <Link
              href={`/apps?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
            >
              <Button size="sm" variant="outline">
                ← Zurück
              </Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Seite {page} von {pages}
          </span>
          {page < pages && (
            <Link
              href={`/apps?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
            >
              <Button size="sm" variant="outline">
                Weiter →
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
