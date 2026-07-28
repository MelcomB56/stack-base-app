import { db } from "@/lib/db";
import { Tag } from "lucide-react";
import Link from "next/link";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    include: { _count: { select: { apps: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Tag size={18} style={{ color: "#2563E8" }} />
          Kategorien
        </h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>
          {categories.length} Kategorie{categories.length !== 1 ? "n" : ""} verfügbar
        </p>
      </div>

      {categories.length === 0 ? (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#7A8BA6" }}>Noch keine Kategorien angelegt.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/apps?categoryId=${cat.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 14, transition: "border-color 150ms, box-shadow 150ms", cursor: "pointer" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(37,99,232,0.3)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#1E3050";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, fontWeight: 700, background: `${cat.color}22`, color: cat.color }}>
                  {cat.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cat.name}
                  </p>
                  {cat.description && (
                    <p style={{ fontSize: 11, color: "#7A8BA6", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.description}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "#7A8BA6", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                  {cat._count.apps}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
