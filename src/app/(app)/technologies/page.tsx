import { db } from "@/lib/db";
import { Cpu, Globe } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  FRONTEND:       "Frontend",
  BACKEND:        "Backend",
  DATABASE:       "Datenbank",
  INFRASTRUCTURE: "Infrastruktur",
  TOOL:           "Tool",
  LANGUAGE:       "Sprache",
  OTHER:          "Sonstige",
};

const CATEGORY_ORDER = ["LANGUAGE", "FRONTEND", "BACKEND", "DATABASE", "INFRASTRUCTURE", "TOOL", "OTHER"];

export default async function TechnologiesPage() {
  const technologies = await db.technology.findMany({
    include: { _count: { select: { apps: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof technologies>>((acc, cat) => {
    const items = technologies.filter((t) => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Cpu size={18} style={{ color: "#2563E8" }} />
          Technologien
        </h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>
          {technologies.length} Technologie{technologies.length !== 1 ? "n" : ""} im Einsatz
        </p>
      </div>

      {technologies.length === 0 ? (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#7A8BA6" }}>Noch keine Technologien angelegt.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0 }}>
              {CATEGORY_LABEL[cat] ?? cat}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
              {items.map((tech) => (
                <div
                  key={tech.id}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#111C2D", border: "1px solid #1E3050", borderRadius: 8 }}
                >
                  {tech.logoUrl ? (
                    <img src={tech.logoUrl} alt={tech.name} style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} />
                  ) : (
                    <Globe size={14} style={{ color: "#7A8BA6", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "#EDF2F7", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tech.name}
                    </p>
                    <p style={{ fontSize: 10, color: "#7A8BA6", margin: "1px 0 0", fontVariantNumeric: "tabular-nums" }}>
                      {tech._count.apps} Apps
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
