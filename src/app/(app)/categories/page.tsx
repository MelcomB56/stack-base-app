import { db } from "@/lib/db";
import { Tag, Grid2X2 } from "lucide-react";
import Link from "next/link";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    include: {
      _count: { select: { apps: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Tag size={18} className="text-primary" />
          Kategorien
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {categories.length} Kategorien verfügbar
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Kategorien angelegt.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/apps?categoryId=${cat.id}`}
              className="group rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-[0_0_0_1px_rgba(37,99,232,0.1),0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-200 p-4 flex items-center gap-4"
            >
              {/* Farbiger Kreis + Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg"
                style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
              >
                {cat.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {cat.name}
                </p>
                {cat.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{cat.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                <Grid2X2 size={11} />
                <span className="tabular-nums font-medium">{cat._count.apps}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
