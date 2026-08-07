import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/page-guard";
import Link from "next/link";
import { Server, Cloud, Container, Layers, Globe, AlertTriangle, WifiOff, ArrowLeft, ExternalLink, Euro } from "lucide-react";
import { AppStatusBadge } from "@/components/apps/AppStatusBadge";
import { AppLogo } from "@/components/apps/AppLogo";

type TargetType   = "SERVER" | "CLOUD" | "KUBERNETES" | "PAAS" | "OTHER";
type TargetStatus = "ACTIVE" | "MAINTENANCE" | "OFFLINE";

const TYPE_META: Record<TargetType, { label: string; icon: React.ReactNode; color: string }> = {
  SERVER:     { label: "Server / VPS",  icon: <Server size={14} />,    color: "#3B82F6" },
  CLOUD:      { label: "Cloud",         icon: <Cloud size={14} />,     color: "#8B5CF6" },
  KUBERNETES: { label: "Kubernetes",    icon: <Layers size={14} />,    color: "#06B6D4" },
  PAAS:       { label: "PaaS",          icon: <Globe size={14} />,     color: "#10B981" },
  OTHER:      { label: "Sonstiges",     icon: <Container size={14} />, color: "#6B7280" },
};

const STATUS_META: Record<TargetStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ACTIVE:      { label: "Aktiv",   color: "#10B981", bg: "#10B98118", icon: <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 6px #10B981" }} /> },
  MAINTENANCE: { label: "Wartung", color: "#F97316", bg: "#F9731618", icon: <AlertTriangle size={12} /> },
  OFFLINE:     { label: "Offline", color: "#EF4444", bg: "#EF444418", icon: <WifiOff size={12} /> },
};

const APP_STATUS_COLOR: Record<string, string> = {
  PRODUCTION:  "#10B981",
  DEVELOPMENT: "#3B82F6",
  TESTING:     "#F59E0B",
  MAINTENANCE: "#F97316",
  ARCHIVED:    "#6B7280",
};

async function getTarget(id: string) {
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-08"

  const target = await db.deploymentTarget.findUnique({
    where: { id },
    include: {
      apps: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDesc: true,
          status: true,
          logoUrl: true,
          urlProd: true,
          hostPort: true,
          containerPort: true,
          runtimeType: true,
          costs: {
            where: { month: currentMonth },
            select: { amount: true, category: true },
          },
          categories: { include: { category: { select: { name: true, color: true } } } },
        },
      },
    },
  });

  if (!target) return null;

  // Alle Kosten vom aktuellen Monat summieren
  const totalMonthlyCost = target.apps.reduce((sum, app) => {
    const appCost = app.costs.reduce((s, c) => s + Number(c.amount), 0);
    return sum + appCost;
  }, 0);

  // Kosten letzter 6 Monate für alle Apps auf diesem Target
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const startMonth = sixMonthsAgo.toISOString().slice(0, 7);

  const historyCosts = await db.appCost.groupBy({
    by: ["month"],
    where: {
      appId: { in: target.apps.map((a) => a.id) },
      month: { gte: startMonth },
    },
    _sum: { amount: true },
    orderBy: { month: "asc" },
  });

  return { target, totalMonthlyCost, historyCosts };
}

export default async function TargetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("targets.read");
  const { id } = await params;
  const data = await getTarget(id);
  if (!data) notFound();

  const { target, totalMonthlyCost, historyCosts } = data;
  const typeMeta   = TYPE_META[target.type as TargetType];
  const statusMeta = STATUS_META[target.status as TargetStatus];

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, maxWidth: 960 }}>

      {/* Breadcrumb */}
      <Link href="/targets" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#7A8BA6", width: "fit-content" }}>
        <ArrowLeft size={13} /> Alle Targets
      </Link>

      {/* Header */}
      <div style={{ background: "#111C2D", border: `1px solid ${target.status === "OFFLINE" ? "#EF444430" : target.status === "MAINTENANCE" ? "#F9731630" : "#1E3050"}`, borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: `${typeMeta.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: typeMeta.color }}>
            {typeMeta.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EDF2F7", margin: 0, letterSpacing: "-0.02em" }}>{target.name}</h1>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, color: typeMeta.color, background: `${typeMeta.color}22`, border: `1px solid ${typeMeta.color}44` }}>
                {typeMeta.icon} {typeMeta.label}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, color: statusMeta.color, background: statusMeta.bg, border: `1px solid ${statusMeta.color}44` }}>
                {statusMeta.icon} {statusMeta.label}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
              {target.host     && <span style={{ fontSize: 13, color: "#7A8BA6" }}>🖥 {target.host}</span>}
              {target.provider && <span style={{ fontSize: 13, color: "#7A8BA6" }}>☁ {target.provider}</span>}
              {target.region   && <span style={{ fontSize: 13, color: "#7A8BA6" }}>📍 {target.region}</span>}
            </div>
            {target.notes && (
              <p style={{ fontSize: 12, color: "#4A5B6F", fontStyle: "italic", margin: "8px 0 0" }}>{target.notes}</p>
            )}
          </div>

          {/* Kosten-Box */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontSize: 11, color: "#7A8BA6", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: ".08em" }}>Kosten diesen Monat</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: totalMonthlyCost > 0 ? "#EDF2F7" : "#4A5B6F", margin: 0, letterSpacing: "-0.02em" }}>
              {totalMonthlyCost > 0 ? `${totalMonthlyCost.toFixed(2)} €` : "—"}
            </p>
            <p style={{ fontSize: 11, color: "#4A5B6F", margin: "3px 0 0" }}>{target.apps.length} App{target.apps.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Kostenverlauf (falls Daten vorhanden) */}
      {historyCosts.length > 0 && (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#7A8BA6", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Kostenverlauf (6 Monate)
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 80 }}>
            {(() => {
              const max = Math.max(...historyCosts.map((c) => Number(c._sum.amount ?? 0)));
              return historyCosts.map((c) => {
                const val = Number(c._sum.amount ?? 0);
                const pct = max > 0 ? (val / max) * 100 : 0;
                const [yr, mo] = c.month.split("-");
                const monthLabel = new Date(parseInt(yr), parseInt(mo) - 1).toLocaleString("de-DE", { month: "short" });
                return (
                  <div key={c.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 9, color: "#7A8BA6" }}>{val > 0 ? `${val.toFixed(0)}€` : ""}</span>
                    <div style={{ width: "100%", background: "#1A2640", borderRadius: 4, height: 60, display: "flex", alignItems: "flex-end" }}>
                      <div style={{ width: "100%", background: "#2563E8", borderRadius: 4, height: `${pct}%`, minHeight: val > 0 ? 3 : 0, transition: "height 300ms" }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#4A5B6F" }}>{monthLabel}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Apps auf diesem Target */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "#7A8BA6", margin: 0, textTransform: "uppercase", letterSpacing: ".08em" }}>
          Apps auf diesem Target ({target.apps.length})
        </h2>

        {target.apps.length === 0 ? (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#4A5B6F", margin: 0 }}>Keine Apps zugewiesen.</p>
            <Link href="/apps" style={{ textDecoration: "none" }}>
              <button style={{ marginTop: 12, padding: "7px 14px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 8, color: "#7A8BA6", fontSize: 13, cursor: "pointer" }}>
                Apps verwalten
              </button>
            </Link>
          </div>
        ) : (
          target.apps.map((app) => {
            const accentColor = APP_STATUS_COLOR[app.status] ?? "#6B7280";
            const appMonthlyCost = app.costs.reduce((s, c) => s + Number(c.amount), 0);
            return (
              <Link key={app.id} href={`/apps/${app.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "stretch", transition: "border-color 200ms" }}
                  className="ds-appcard">
                  {/* Status-Streifen */}
                  <div style={{ width: 3, background: accentColor, flexShrink: 0 }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", flex: 1, minWidth: 0 }}>
                    <AppLogo logoUrl={app.logoUrl} urlProd={app.urlProd} name={app.name} accentColor={accentColor} size={40} borderRadius={9} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#EDF2F7" }}>{app.name}</span>
                        <AppStatusBadge status={app.status as never} showDot />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        {app.urlProd && (
                          <span style={{ fontSize: 11, color: "#7A8BA6", display: "flex", alignItems: "center", gap: 3 }}>
                            <ExternalLink size={9} />{app.urlProd.replace(/^https?:\/\//, "")}
                          </span>
                        )}
                        {app.hostPort && (
                          <span style={{ fontSize: 11, color: "#7A8BA6" }}>Port {app.hostPort}</span>
                        )}
                        {app.runtimeType && (
                          <span style={{ fontSize: 11, color: "#4A5B6F", background: "#1A2640", padding: "1px 6px", borderRadius: 4, border: "1px solid #1E3050" }}>
                            {app.runtimeType}
                          </span>
                        )}
                        {app.categories.slice(0, 2).map(({ category }) => (
                          <span key={category.name} style={{ fontSize: 10, color: category.color, background: `${category.color}22`, padding: "1px 6px", borderRadius: 4 }}>
                            {category.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Kosten */}
                    {appMonthlyCost > 0 && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#7A8BA6", fontSize: 11, justifyContent: "flex-end", marginBottom: 1 }}>
                          <Euro size={10} /> Monat
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#EDF2F7" }}>{appMonthlyCost.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
