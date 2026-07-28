import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AppCard } from "@/components/apps/AppCard";
import { Heart } from "lucide-react";

export default async function FavoritesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const favorites = userId
    ? await db.userFavorite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          app: {
            include: {
              categories: { include: { category: true } },
            },
          },
        },
      })
    : [];

  const apps = favorites
    .map((f) => f.app)
    .filter((app) => !app.deletedAt);

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Heart size={18} className="text-primary" />
          Favoriten
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {apps.length} gemerkte App{apps.length !== 1 ? "s" : ""}
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Noch keine Favoriten gesetzt.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Öffne eine App und klicke auf das Herz-Symbol.
          </p>
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
    </div>
  );
}
