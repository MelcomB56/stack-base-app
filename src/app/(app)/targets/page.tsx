import { db } from "@/lib/db";
import { TargetsClient } from "@/components/targets/TargetsClient";
import { requirePermission } from "@/lib/page-guard";

export default async function TargetsPage() {
  await requirePermission("targets.read");

  const targets = await db.deploymentTarget.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { apps: true } } },
  });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#EDF2F7", margin: 0, letterSpacing: "-0.02em" }}>
          Deployment Targets
        </h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", margin: "4px 0 0" }}>
          Wo laufen deine Apps? Server, Cloud, PaaS — einmal pflegen, überall zuweisen.
        </p>
      </div>
      <TargetsClient initial={targets.map((t) => ({ ...t, appCount: t._count.apps }))} />
    </div>
  );
}
