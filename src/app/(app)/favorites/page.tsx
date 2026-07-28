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
            include: { categories: { include: { category: true } } },
          },
        },
      })
    : [];

  const apps = favorites.map((f) => f.app).filter((app) => !app.deletedAt);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Heart size={18} style={{ color: "#2563E8" }} />
          Favoriten
        </h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>
          {apps.length} gemerkte App{apps.length !== 1 ? "s" : ""}
        </p>
      </div>

      {apps.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
          <Heart size={32} style={{ color: "rgba(37,99,232,0.2)", marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: "#7A8BA6" }}>Noch keine Favoriten gesetzt.</p>
          <p style={{ fontSize: 11, color: "#4A5A72", marginTop: 4 }}>
            Öffne eine App und klicke auf das Herz-Symbol.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {apps.map((app) => (
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
