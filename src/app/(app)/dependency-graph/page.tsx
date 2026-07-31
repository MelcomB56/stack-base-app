import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DependencyGraph } from "@/components/dependency-graph/DependencyGraph";

export const metadata = { title: "Dependency Graph — Stack-Base" };

export default async function DependencyGraphPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [apps, dependencies] = await Promise.all([
    db.app.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true, status: true, shortDesc: true },
      orderBy: { name: "asc" },
    }),
    db.appDependency.findMany({
      select: {
        id: true, appId: true, dependsOnAppId: true,
        dependsOnName: true, relationshipType: true, description: true,
      },
    }),
  ]);

  const edgeCount = dependencies.length;
  const externalCount = dependencies.filter((d) => !d.dependsOnAppId).length;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header bar */}
      <div style={{
        padding: "10px 20px", borderBottom: "1px solid #1E3050",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0B1220", flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 14, fontWeight: 700, color: "#EDF2F7", margin: 0, letterSpacing: "-0.01em" }}>
            Dependency Graph
          </h1>
          <p style={{ fontSize: 11, color: "#7A8BA6", margin: "1px 0 0" }}>
            {apps.length} Apps · {edgeCount} Verbindungen · {externalCount} externe Abhängigkeiten
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#7A8BA6" }}>
          {[
            { color: "#10B981", label: "Prod" },
            { color: "#3B82F6", label: "Dev" },
            { color: "#F59E0B", label: "Testing" },
            { color: "#F97316", label: "Wartung" },
            { color: "#6B7280", label: "Archiv" },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Canvas fills the rest */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <DependencyGraph apps={apps} dependencies={dependencies} />
      </div>
    </div>
  );
}
