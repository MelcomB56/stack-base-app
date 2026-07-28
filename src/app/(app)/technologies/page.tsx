import { db } from "@/lib/db";
import { Cpu, Grid2X2, Globe } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  DATABASE: "Datenbank",
  INFRASTRUCTURE: "Infrastruktur",
  TOOL: "Tool",
  LANGUAGE: "Sprache",
  OTHER: "Sonstige",
};

const CATEGORY_ORDER = ["LANGUAGE", "FRONTEND", "BACKEND", "DATABASE", "INFRASTRUCTURE", "TOOL", "OTHER"];

export default async function TechnologiesPage() {
  const technologies = await db.technology.findMany({
    include: {
      _count: { select: { apps: true } },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof technologies>>((acc, cat) => {
    const items = technologies.filter((t) => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Cpu size={18} className="text-primary" />
          Technologien
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {technologies.length} Technologie{technologies.length !== 1 ? "n" : ""} im Einsatz
        </p>
      </div>

      {technologies.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Technologien angelegt.</p>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {CATEGORY_LABEL[cat] ?? cat}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {items.map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-border/80 transition-colors"
                >
                  {tech.logoUrl ? (
                    <img src={tech.logoUrl} alt={tech.name} className="w-5 h-5 object-contain shrink-0" />
                  ) : (
                    <Globe size={14} className="text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{tech.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                      <Grid2X2 size={9} />
                      <span className="tabular-nums">{tech._count.apps}</span>
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
