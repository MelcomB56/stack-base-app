import { db } from "@/lib/db";
import { Layers, Cpu } from "lucide-react";
import Link from "next/link";

export default async function StacksPage() {
  const stacks = await db.stack.findMany({
    include: {
      _count: { select: { apps: true } },
      technologies: { include: { technology: true }, take: 5 },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={18} style={{ color: "#2563E8" }} />
          Stacks
        </h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>
          {stacks.length} Tech-Stack{stacks.length !== 1 ? "s" : ""} definiert
        </p>
      </div>

      {stacks.length === 0 ? (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#7A8BA6" }}>Noch keine Stacks angelegt.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {stacks.map((stack) => (
            <div key={stack.id} style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(37,99,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Layers size={15} style={{ color: "#2563E8" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>{stack.name}</p>
                    {stack.description && (
                      <p style={{ fontSize: 11, color: "#7A8BA6", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                        {stack.description}
                      </p>
                    )}
                  </div>
                </div>
                <Link href={`/apps?stackId=${stack.id}`} style={{ fontSize: 11, color: "#7A8BA6", textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  {stack._count.apps} Apps
                </Link>
              </div>

              {stack.technologies.length > 0 && (
                <div style={{ borderTop: "1px solid #1E3050", paddingTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {stack.technologies.map(({ technology }) => (
                    <span key={technology.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: "#1A2640", fontSize: 10, color: "#7A8BA6" }}>
                      <Cpu size={9} />
                      {technology.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
