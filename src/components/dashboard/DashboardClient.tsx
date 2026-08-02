"use client";

import Link from "next/link";
import { Globe, ExternalLink, ShieldAlert, Activity } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type Stats = {
  total: number; production: number; development: number;
  testing: number; maintenance: number; archived: number;
  productionUp: number; openIncidents: number; healthToday: number;
  costCurrentMonth: number; costMonth: string;
  activitySpark: number[]; incidentSpark: number[];
};
type AppRow = {
  id: string; name: string; slug: string; status: string;
  urlProd: string | null; logoUrl: string | null; openIncidents: number;
  health: { status: string; responseTime: number | null; checkedAt: string } | null;
};
type IncidentRow = {
  id: string; title: string; severity: string; status: string;
  createdAt: string; appName: string; appSlug: string;
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
  UP: "#10B981", DEGRADED: "#F59E0B", DOWN: "#EF4444", UNKNOWN: "#4A5B6F",
};
const SEV_COLOR: Record<string, string> = {
  CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#F59E0B", LOW: "#6B7280",
};
const SEV_LABEL: Record<string, string> = {
  CRITICAL: "Kritisch", HIGH: "Hoch", MEDIUM: "Mittel", LOW: "Niedrig",
};
const ACTION_LABEL: Record<string, string> = {
  "app.created": "angelegt", "app.updated": "aktualisiert",
  "app.deleted": "gelöscht", "status.changed": "Status geändert",
};
const APP_STATUS_ORDER: Record<string, number> = {
  PRODUCTION: 0, MAINTENANCE: 1, TESTING: 2, DEVELOPMENT: 3, ARCHIVED: 4,
};
const HEALTH_ORDER: Record<string, number> = { DOWN: 0, DEGRADED: 1, UNKNOWN: 2, UP: 3 };

function timeAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1)  return "gerade eben";
  if (diff < 60) return `vor ${diff} Min.`;
  const h = Math.round(diff / 60);
  if (h < 24)   return `vor ${h} Std.`;
  return `vor ${Math.round(h / 24)} d`;
}

function sortedApps(apps: AppRow[]) {
  return [...apps]
    .filter((a) => a.status !== "ARCHIVED")
    .sort((a, b) => {
      const so = (APP_STATUS_ORDER[a.status] ?? 9) - (APP_STATUS_ORDER[b.status] ?? 9);
      if (so !== 0) return so;
      const ho = (HEALTH_ORDER[a.health?.status ?? "UNKNOWN"] ?? 2) - (HEALTH_ORDER[b.health?.status ?? "UNKNOWN"] ?? 2);
      if (ho !== 0) return ho;
      return a.name.localeCompare(b.name, "de");
    });
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accent, spark, icon,
}: {
  label: string; value: string | number; sub?: string;
  accent: string; spark: number[]; icon: React.ReactNode;
}) {
  const data = spark.map((v, i) => ({ i, v }));
  const sparkId = `spark-${label.replace(/\s/g, "")}`;

  return (
    <div style={{
      background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12,
      borderTop: `3px solid ${accent}`, padding: "16px 18px 0",
      display: "flex", flexDirection: "column", gap: 4, overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#7A8BA6" }}>
          {label}
        </span>
        <span style={{ color: accent, opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1.1, color: "#EDF2F7", letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#7A8BA6" }}>{sub}</div>
      )}
      <div style={{ height: 52, margin: "8px -18px 0" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={accent} strokeWidth={1.5}
              fill={`url(#${sparkId})`} dot={false} isAnimationActive={false} />
            <Tooltip
              contentStyle={{ background: "#0B1220", border: "1px solid #1E3050", borderRadius: 6, fontSize: 11, color: "#EDF2F7" }}
              formatter={(v: unknown) => [v, label]}
              labelFormatter={() => ""}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Status Donut ─────────────────────────────────────────────────────────────

const DONUT_ENTRIES = [
  { key: "production",  label: "Produktion",  color: "#10B981" },
  { key: "development", label: "Entwicklung", color: "#3B82F6" },
  { key: "testing",     label: "Testing",     color: "#F59E0B" },
  { key: "maintenance", label: "Wartung",     color: "#F97316" },
  { key: "archived",    label: "Archiviert",  color: "#6B7280" },
];

function StatusPanel({ stats }: { stats: Stats }) {
  const entries = DONUT_ENTRIES.map((e) => ({
    ...e, value: stats[e.key as keyof Stats] as number,
  })).filter((e) => e.value > 0);
  const empty = entries.length === 0;

  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 20 }}>
      <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#7A8BA6" }}>
        Status-Übersicht
      </p>
      <div style={{ position: "relative", width: 148, height: 148, margin: "0 auto 20px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={empty ? [{ name: "Leer", value: 1 }] : entries}
              cx="50%" cy="50%" innerRadius={50} outerRadius={70}
              dataKey="value" paddingAngle={2} isAnimationActive={false}
            >
              {empty
                ? <Cell fill="#1A2640" />
                : entries.map((e, i) => <Cell key={i} fill={e.color} />)
              }
            </Pie>
            {!empty && (
              <Tooltip
                contentStyle={{ background: "#0B1220", border: "1px solid #1E3050", borderRadius: 6, fontSize: 11, color: "#EDF2F7" }}
                formatter={(v: unknown, name: unknown) => [v, name]}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#EDF2F7", letterSpacing: "-0.03em" }}>{stats.total}</span>
          <span style={{ fontSize: 10, color: "#7A8BA6", marginTop: 1 }}>Apps</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {DONUT_ENTRIES.map(({ key, label, color }) => {
          const val = stats[key as keyof Stats] as number;
          const pct = stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: "#7A8BA6" }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", fontVariantNumeric: "tabular-nums" }}>{val}</span>
              <span style={{ fontSize: 10, color: "#4A5B6F", fontVariantNumeric: "tabular-nums", minWidth: 28, textAlign: "right" }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── App List ─────────────────────────────────────────────────────────────────

function AppList({ apps }: { apps: AppRow[] }) {
  const sorted = sortedApps(apps);
  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid #1E3050", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#7A8BA6" }}>Apps</span>
        <Link href="/apps" style={{ fontSize: 11, color: "#2563E8", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
          Alle <ExternalLink size={10} />
        </Link>
      </div>
      {sorted.length === 0 && (
        <p style={{ padding: "24px 18px", fontSize: 13, color: "#7A8BA6", margin: 0 }}>Keine Apps vorhanden.</p>
      )}
      {sorted.map((app, idx) => {
        const hStatus = app.health?.status ?? null;
        const hColor = hStatus ? HEALTH_COLOR[hStatus] ?? "#4A5B6F" : "#2A3850";
        const isDown = hStatus === "DOWN";
        return (
          <Link key={app.slug} href={`/apps/${app.slug}`} style={{ textDecoration: "none" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", borderBottom: idx < sorted.length - 1 ? "1px solid #0F1D30" : "none", transition: "background 120ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <span className={isDown ? "pulse-dot" : ""} style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: hColor }} />
              {app.logoUrl
                ? <img src={app.logoUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "contain", flexShrink: 0 }} />
                : <div style={{ width: 20, height: 20, borderRadius: 4, background: `${STATUS_COLOR[app.status] ?? "#6B7280"}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Globe size={10} style={{ color: STATUS_COLOR[app.status] ?? "#6B7280" }} />
                  </div>
              }
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#EDF2F7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {app.name}
              </span>
              {app.openIncidents > 0 && (
                <span style={{ padding: "1px 6px", borderRadius: 99, fontSize: 9, fontWeight: 700, background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(239,68,68,0.25)", flexShrink: 0 }}>
                  {app.openIncidents}
                </span>
              )}
              <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 9, fontWeight: 600, flexShrink: 0, background: `${STATUS_COLOR[app.status] ?? "#6B7280"}15`, color: STATUS_COLOR[app.status] ?? "#6B7280", border: `1px solid ${STATUS_COLOR[app.status] ?? "#6B7280"}25` }}>
                {STATUS_LABEL[app.status] ?? app.status}
              </span>
              <span style={{ fontSize: 10, color: "#4A5B6F", fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: 58, textAlign: "right" }}>
                {app.health?.responseTime != null ? `${app.health.responseTime} ms` : hStatus === "DOWN" ? "DOWN" : hStatus ? "—" : "kein Monitor"}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Incidents Panel ──────────────────────────────────────────────────────────

function IncidentsPanel({ incidents }: { incidents: IncidentRow[] }) {
  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid #1E3050", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#7A8BA6" }}>Aktuelle Incidents</span>
        {incidents.length > 0 && (
          <span style={{ padding: "1px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(239,68,68,0.25)" }}>
            {incidents.length}
          </span>
        )}
      </div>
      {incidents.length === 0 ? (
        <div style={{ padding: "28px 18px", textAlign: "center" }}>
          <ShieldAlert size={24} style={{ color: "#1E3050", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 12, color: "#4A5B6F", margin: 0 }}>Keine offenen Incidents</p>
        </div>
      ) : (
        <div>
          {incidents.map((inc, idx) => {
            const color = SEV_COLOR[inc.severity] ?? "#6B7280";
            return (
              <Link key={inc.id} href={`/apps/${inc.appSlug}`} style={{ textDecoration: "none" }}>
                <div
                  style={{ display: "flex", gap: 12, padding: "11px 18px", borderBottom: idx < incidents.length - 1 ? "1px solid #0F1D30" : "none", borderLeft: `3px solid ${color}`, transition: "background 120ms" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "#EDF2F7", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {inc.title}
                    </p>
                    <p style={{ fontSize: 10, color: "#7A8BA6", margin: "2px 0 0" }}>
                      {inc.appName} · {timeAgo(inc.createdAt)}
                    </p>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${color}20`, color, border: `1px solid ${color}30`, flexShrink: 0, alignSelf: "flex-start" }}>
                    {SEV_LABEL[inc.severity] ?? inc.severity}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Activity Panel ───────────────────────────────────────────────────────────

function ActivityPanel({ items }: { items: ActivityEntry[] }) {
  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid #1E3050" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#7A8BA6" }}>Letzte Aktivitäten</span>
      </div>
      <div>
        {items.length === 0 && (
          <p style={{ padding: "24px 18px", fontSize: 12, color: "#4A5B6F", margin: 0 }}>Noch keine Aktivitäten.</p>
        )}
        {items.map((entry, idx) => (
          <div key={entry.id} style={{ display: "flex", gap: 10, padding: "9px 18px", borderBottom: idx < items.length - 1 ? "1px solid #0F1D30" : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4, flexShrink: 0 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2563E8" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "#C4D0E0", margin: 0, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 600, color: "#EDF2F7" }}>{entry.userName}</span>
                {" hat "}
                {entry.appName && entry.appSlug
                  ? <Link href={`/apps/${entry.appSlug}`} style={{ color: "#60A5FA", textDecoration: "none" }}>{entry.appName}</Link>
                  : "eine App"}
                {" "}<span style={{ color: "#7A8BA6" }}>{ACTION_LABEL[entry.action] ?? entry.action}</span>
              </p>
              <p style={{ fontSize: 9, color: "#4A5B6F", margin: "1px 0 0" }}>{timeAgo(entry.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardClient({ stats, apps, openIncidents, recentActivity }: {
  stats: Stats; apps: AppRow[]; openIncidents: IncidentRow[]; recentActivity: ActivityEntry[];
}) {
  const now = new Date().toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Prod-uptime-sparkline: just show productionUp out of 7 days (flat line as placeholder)
  const prodSpark = Array(7).fill(stats.productionUp);
  const healthSpark = Array(7).fill(Math.round(stats.healthToday / 7));

  return (
    <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 11, color: "#4A5B6F", margin: "2px 0 0" }}>{now}</p>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard
          label="Apps gesamt" value={stats.total}
          sub={`${stats.production} in Produktion`}
          accent="#3B82F6" spark={stats.activitySpark}
          icon={<Activity size={14} />}
        />
        <KpiCard
          label="Produktion UP" value={`${stats.productionUp} / ${stats.production}`}
          sub={stats.production > 0 ? `${Math.round((stats.productionUp / stats.production) * 100)} % Verfügbarkeit` : "Keine Prod-Apps"}
          accent="#10B981" spark={prodSpark}
          icon={<Activity size={14} />}
        />
        <KpiCard
          label="Offene Incidents" value={stats.openIncidents}
          sub={stats.openIncidents === 0 ? "Alles in Ordnung" : "Handlungsbedarf"}
          accent={stats.openIncidents > 0 ? "#EF4444" : "#10B981"} spark={stats.incidentSpark}
          icon={<ShieldAlert size={14} />}
        />
        <KpiCard
          label="Health Checks (24h)" value={stats.healthToday}
          sub="automatisch geprüft"
          accent="#8B5CF6" spark={healthSpark}
          icon={<Activity size={14} />}
        />
      </div>

      {/* Main Grid: 3 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 12, alignItems: "start" }}>

        {/* Left: Status Donut */}
        <StatusPanel stats={stats} />

        {/* Center: App List */}
        <AppList apps={apps} />

        {/* Right: Incidents + Activity stacked */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <IncidentsPanel incidents={openIncidents} />
          <ActivityPanel items={recentActivity} />
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.6); }
        }
        .pulse-dot { animation: pulse 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
