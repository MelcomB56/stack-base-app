"use client";

import Link from "next/link";
import { Globe, AlertTriangle, ExternalLink } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Stats = {
  total: number;
  production: number; development: number; testing: number;
  maintenance: number; archived: number;
  productionUp: number;
  openIncidents: number;
  costCurrentMonth: number;
  costMonth: string;
};

type AppRow = {
  id: string; name: string; slug: string; status: string;
  urlProd: string | null; logoUrl: string | null;
  openIncidents: number;
  health: { status: string; responseTime: number | null; checkedAt: string } | null;
};

type ActivityEntry = {
  id: string; action: string; appName: string | null;
  appSlug: string | null; userName: string; createdAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PRODUCTION: "Produktion", DEVELOPMENT: "Entwicklung",
  TESTING: "Testing", MAINTENANCE: "Wartung", ARCHIVED: "Archiviert",
};

const STATUS_COLOR: Record<string, string> = {
  PRODUCTION: "#10B981", DEVELOPMENT: "#3B82F6",
  TESTING: "#F59E0B", MAINTENANCE: "#F97316", ARCHIVED: "#6B7280",
};

const HEALTH_COLOR: Record<string, string> = {
  UP: "#10B981", DEGRADED: "#F59E0B", DOWN: "#EF4444", UNKNOWN: "#6B7280",
};

const HEALTH_ORDER: Record<string, number> = { DOWN: 0, DEGRADED: 1, UNKNOWN: 2, UP: 3 };
const APP_STATUS_ORDER: Record<string, number> = {
  PRODUCTION: 0, MAINTENANCE: 1, TESTING: 2, DEVELOPMENT: 3, ARCHIVED: 4,
};

function timeAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1)  return "gerade eben";
  if (diff < 60) return `vor ${diff} Min.`;
  const h = Math.round(diff / 60);
  if (h < 24)   return `vor ${h} Std.`;
  return `vor ${Math.round(h / 24)} d`;
}

const ACTION_LABEL: Record<string, string> = {
  "app.created": "angelegt",
  "app.updated": "aktualisiert",
  "app.deleted": "gelöscht",
  "status.changed": "Status geändert",
};

function sortApps(apps: AppRow[]): AppRow[] {
  return [...apps].sort((a, b) => {
    const sa = APP_STATUS_ORDER[a.status] ?? 9;
    const sb = APP_STATUS_ORDER[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    // Within same status: problems first
    const ha = HEALTH_ORDER[a.health?.status ?? "UNKNOWN"] ?? 2;
    const hb = HEALTH_ORDER[b.health?.status ?? "UNKNOWN"] ?? 2;
    if (ha !== hb) return ha - hb;
    return a.name.localeCompare(b.name, "de");
  });
}

// ─── KPI Strip ───────────────────────────────────────────────────────────────

function KpiStrip({ stats }: { stats: Stats }) {
  const chips = [
    { label: "Apps gesamt",      value: stats.total,          color: "#7A8BA6" },
    { label: "Produktion",       value: stats.production,     color: "#10B981" },
    { label: "Entwicklung",      value: stats.development,    color: "#3B82F6" },
    { label: "Offene Incidents", value: stats.openIncidents,  color: stats.openIncidents > 0 ? "#EF4444" : "#7A8BA6" },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {chips.map((c) => (
        <div key={c.label} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "5px 12px", borderRadius: 99,
          background: "#111C2D", border: "1px solid #1E3050",
          fontSize: 12,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
          <span style={{ color: "#7A8BA6" }}>{c.label}</span>
          <span style={{ fontWeight: 700, color: "#EDF2F7", fontVariantNumeric: "tabular-nums" }}>{c.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Incident Banner ─────────────────────────────────────────────────────────

function IncidentBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Link href="/apps" style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", borderRadius: 10,
        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
        color: "#FCA5A5", fontSize: 13, fontWeight: 500,
        transition: "background 150ms",
      }}>
        <AlertTriangle size={15} style={{ flexShrink: 0, color: "#EF4444" }} />
        {count === 1 ? "1 offener Incident" : `${count} offene Incidents`} — jetzt prüfen
        <ExternalLink size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />
      </div>
    </Link>
  );
}

// ─── App List ─────────────────────────────────────────────────────────────────

function AppList({ apps }: { apps: AppRow[] }) {
  const sorted = sortApps(apps.filter((a) => a.status !== "ARCHIVED"));

  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid #1E3050", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>Apps</span>
        <Link href="/apps" style={{ fontSize: 12, color: "#2563E8", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          Alle anzeigen <ExternalLink size={11} />
        </Link>
      </div>

      {/* Rows */}
      <div>
        {sorted.length === 0 && (
          <p style={{ padding: "24px 18px", fontSize: 13, color: "#7A8BA6", margin: 0 }}>Keine Apps vorhanden.</p>
        )}
        {sorted.map((app, idx) => {
          const hStatus = app.health?.status ?? null;
          const hColor = hStatus ? HEALTH_COLOR[hStatus] ?? "#6B7280" : "#2A3850";
          const isLast = idx === sorted.length - 1;

          return (
            <Link key={app.slug} href={`/apps/${app.slug}`} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 18px",
                borderBottom: isLast ? "none" : "1px solid #152035",
                transition: "background 120ms",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {/* Health dot */}
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: hColor,
                  boxShadow: hStatus === "UP" ? `0 0 6px ${hColor}` : hStatus === "DOWN" ? `0 0 6px ${hColor}` : "none",
                }} />

                {/* Logo or icon */}
                {app.logoUrl ? (
                  <img src={app.logoUrl} alt="" style={{ width: 22, height: 22, borderRadius: 5, objectFit: "contain", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: `${STATUS_COLOR[app.status] ?? "#6B7280"}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Globe size={11} style={{ color: STATUS_COLOR[app.status] ?? "#6B7280" }} />
                  </div>
                )}

                {/* Name */}
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#EDF2F7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {app.name}
                </span>

                {/* Open incidents badge */}
                {app.openIncidents > 0 && (
                  <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(239,68,68,0.3)", flexShrink: 0 }}>
                    {app.openIncidents} Incident{app.openIncidents > 1 ? "s" : ""}
                  </span>
                )}

                {/* Status badge */}
                <span style={{
                  padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600, flexShrink: 0,
                  background: `${STATUS_COLOR[app.status] ?? "#6B7280"}18`,
                  color: STATUS_COLOR[app.status] ?? "#6B7280",
                  border: `1px solid ${STATUS_COLOR[app.status] ?? "#6B7280"}33`,
                }}>
                  {STATUS_LABEL[app.status] ?? app.status}
                </span>

                {/* Response time or health info */}
                <span style={{ fontSize: 11, color: "#4A5B6F", fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: 60, textAlign: "right" }}>
                  {app.health?.responseTime != null
                    ? `${app.health.responseTime} ms`
                    : app.health?.checkedAt
                      ? hStatus === "DOWN" ? "DOWN" : "—"
                      : "kein Monitor"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed({ items }: { items: ActivityEntry[] }) {
  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid #1E3050" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>Letzte Aktivitäten</span>
      </div>
      <div style={{ padding: "4px 0" }}>
        {items.length === 0 && (
          <p style={{ padding: "24px 18px", fontSize: 13, color: "#7A8BA6", margin: 0 }}>Noch keine Aktivitäten.</p>
        )}
        {items.map((entry, idx) => (
          <div key={entry.id} style={{ display: "flex", gap: 12, padding: "10px 18px", borderBottom: idx < items.length - 1 ? "1px solid #152035" : "none" }}>
            {/* Timeline dot */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3, flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563E8" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, color: "#EDF2F7", margin: 0, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>{entry.userName}</span>
                {" hat "}
                {entry.appName && entry.appSlug ? (
                  <Link href={`/apps/${entry.appSlug}`} style={{ color: "#60A5FA", textDecoration: "none" }}>
                    {entry.appName}
                  </Link>
                ) : "eine App"}
                {" "}
                <span style={{ color: "#7A8BA6" }}>{ACTION_LABEL[entry.action] ?? entry.action}</span>
              </p>
              <p style={{ fontSize: 10, color: "#4A5B6F", margin: "2px 0 0" }}>{timeAgo(entry.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Cost Strip ───────────────────────────────────────────────────────────────

function CostStrip({ costCurrentMonth, costMonth }: { costCurrentMonth: number; costMonth: string }) {
  if (costCurrentMonth === 0) return null;
  const [y, m] = costMonth.split("-");
  const months = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const label = `${months[parseInt(m) - 1]} ${y}`;
  const fmt = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 16px", borderRadius: 10,
      background: "#111C2D", border: "1px solid #1E3050", fontSize: 13,
    }}>
      <span style={{ color: "#7A8BA6" }}>Hosting-Kosten {label}</span>
      <span style={{ fontWeight: 700, color: "#EDF2F7", fontVariantNumeric: "tabular-nums" }}>{fmt(costCurrentMonth)}</span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardClient({ stats, apps, recentActivity }: {
  stats: Stats;
  apps: AppRow[];
  recentActivity: ActivityEntry[];
}) {
  const now = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: "#4A5B6F", marginTop: 2, marginBottom: 0 }}>{now}</p>
        </div>
        <KpiStrip stats={stats} />
      </div>

      {/* Incident banner */}
      <IncidentBanner count={stats.openIncidents} />

      {/* Cost strip (only if data exists) */}
      <CostStrip costCurrentMonth={stats.costCurrentMonth} costMonth={stats.costMonth} />

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 14, alignItems: "start" }}>
        <AppList apps={apps} />
        <ActivityFeed items={recentActivity} />
      </div>
    </div>
  );
}
