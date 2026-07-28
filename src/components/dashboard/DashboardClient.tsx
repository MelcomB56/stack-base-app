"use client";

import Link from "next/link";
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip } from "recharts";

type Stats = {
  total: number; production: number; development: number;
  testing: number; maintenance: number; archived: number;
};
type ActivityEntry = {
  id: string; action: string; appName: string | null;
  appSlug: string | null; userName: string; createdAt: string;
};
type TopApp = { name: string; status: string; slug: string };

function makeSpark(base: number) {
  return Array.from({ length: 10 }, (_, i) => ({
    v: Math.max(0, base + Math.round((Math.random() - 0.45) * (base * 0.4 + 2) * (i / 5 + 0.5))),
  }));
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ label, value, iconBg, iconColor, iconPath, sparkColor, trend }: {
  label: string; value: number; iconBg: string; iconColor: string;
  iconPath: React.ReactNode; sparkColor: string; trend?: string;
}) {
  const spark = makeSpark(value);
  return (
    <div
      style={{
        background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12,
        padding: 14, display: "flex", flexDirection: "column", gap: 8,
        transition: "border-color 200ms", cursor: "default",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#263450"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1E3050"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
            {iconPath}
          </svg>
        </div>
        {trend && (
          <span style={{ fontSize: 10, color: "#10B981", display: "flex", alignItems: "center", gap: 2 }}>
            ↑ {trend}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1.1, color: "#EDF2F7" }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: "#7A8BA6", marginTop: 1 }}>{label}</div>
      </div>
      <div style={{ height: 36, margin: "0 -4px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={spark} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
            <Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Donut ────────────────────────────────────────────────────────────────────

const DONUT_COLORS = {
  production:  "#10B981",
  development: "#3B82F6",
  testing:     "#F59E0B",
  maintenance: "#F97316",
  archived:    "#6B7280",
};

function StatusDonut({ stats }: { stats: Stats }) {
  const data = [
    { name: "Produktion",  value: stats.production,  color: DONUT_COLORS.production },
    { name: "Entwicklung", value: stats.development, color: DONUT_COLORS.development },
    { name: "Testing",     value: stats.testing,     color: DONUT_COLORS.testing },
    { name: "Wartung",     value: stats.maintenance, color: DONUT_COLORS.maintenance },
    { name: "Archiviert",  value: stats.archived,    color: DONUT_COLORS.archived },
  ].filter((d) => d.value > 0);

  const empty = data.length === 0;

  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#EDF2F7" }}>
        <span style={{ width: 6, height: 16, borderRadius: 3, background: "#2563E8", flexShrink: 0, display: "inline-block" }} />
        Status-Übersicht
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
        <div style={{ position: "relative", width: 112, height: 112, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={empty ? [{ name: "Leer", value: 1 }] : data}
                cx="50%" cy="50%"
                innerRadius={38} outerRadius={54}
                dataKey="value" paddingAngle={2} isAnimationActive={false}
              >
                {empty
                  ? <Cell fill="#1A2640" />
                  : data.map((d, i) => <Cell key={i} fill={d.color} />)
                }
              </Pie>
              {!empty && (
                <Tooltip
                  contentStyle={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: "#EDF2F7" }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", pointerEvents: "none",
          }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#EDF2F7" }}>{stats.total}</span>
            <span style={{ fontSize: 9, color: "#7A8BA6", marginTop: 1 }}>Gesamt</span>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { label: "Produktion",  value: stats.production,  color: DONUT_COLORS.production },
            { label: "Entwicklung", value: stats.development, color: DONUT_COLORS.development },
            { label: "Testing",     value: stats.testing,     color: DONUT_COLORS.testing },
            { label: "Wartung",     value: stats.maintenance, color: DONUT_COLORS.maintenance },
            { label: "Archiviert",  value: stats.archived,    color: DONUT_COLORS.archived },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#EDF2F7" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ flex: 1, color: "#7A8BA6" }}>{label}</span>
              <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Top Apps ─────────────────────────────────────────────────────────────────

const STATUS_BAR_COLOR: Record<string, string> = {
  PRODUCTION:  "#10B981",
  DEVELOPMENT: "#3B82F6",
  TESTING:     "#F59E0B",
  MAINTENANCE: "#F97316",
  ARCHIVED:    "#6B7280",
};

function TopApps({ apps, total }: { apps: TopApp[]; total: number }) {
  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#EDF2F7" }}>
        <span style={{ width: 6, height: 16, borderRadius: 3, background: "#22D3EE", flexShrink: 0, display: "inline-block" }} />
        Top Apps
      </div>
      {apps.length === 0 ? (
        <p style={{ fontSize: 12, color: "#7A8BA6", textAlign: "center", padding: "16px 0" }}>Noch keine Apps vorhanden</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
          {apps.map((app) => {
            const pct = total > 0 ? Math.round((1 / Math.max(total, 1)) * 100) : 0;
            const barColor = STATUS_BAR_COLOR[app.status] ?? "#6B7280";
            return (
              <Link key={app.slug} href={`/apps/${app.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                  <span style={{ fontWeight: 500, color: "#EDF2F7" }}>{app.name}</span>
                  <span style={{ color: "#7A8BA6", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: "#1A2640", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(20, pct)}%`, background: barColor, borderRadius: 99 }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

const ACTION_LABEL: Record<string, string> = {
  "app.created":    "angelegt",
  "app.updated":    "aktualisiert",
  "app.deleted":    "gelöscht",
  "status.changed": "Status geändert",
};

function timeAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1)  return "gerade eben";
  if (diff < 60) return `vor ${diff} Min.`;
  const h = Math.round(diff / 60);
  if (h < 24)    return `vor ${h} Std.`;
  return `vor ${Math.round(h / 24)} Tagen`;
}

function ActivityFeed({ items }: { items: ActivityEntry[] }) {
  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#EDF2F7" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563E8" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        Letzte Aktivitäten
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: 12, color: "#7A8BA6", textAlign: "center", padding: "16px 0" }}>Noch keine Aktivitäten</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {items.map((entry, idx) => (
            <div key={entry.id} style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563E8", marginTop: 4, flexShrink: 0 }} />
                {idx < items.length - 1 && (
                  <div style={{ width: 1, flex: 1, background: "#1E3050", marginTop: 4, minHeight: 14 }} />
                )}
              </div>
              <div style={{ paddingBottom: 13, flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, lineHeight: 1.4, color: "#EDF2F7", margin: 0 }}>
                  <span style={{ fontWeight: 600 }}>{entry.userName}</span>
                  {" hat "}
                  {entry.appName && entry.appSlug ? (
                    <Link href={`/apps/${entry.appSlug}`} style={{ color: "#2563E8", textDecoration: "none" }}>
                      {entry.appName}
                    </Link>
                  ) : "eine App"}
                  {" "}
                  <span style={{ color: "#7A8BA6" }}>{ACTION_LABEL[entry.action] ?? entry.action}</span>
                </p>
                <p style={{ fontSize: 10, color: "#7A8BA6", marginTop: 2, marginBottom: 0 }}>{timeAgo(entry.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardClient({ stats, recentActivity, topApps }: {
  stats: Stats; recentActivity: ActivityEntry[]; topApps: TopApp[];
}) {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 2, marginBottom: 0 }}>Übersicht aller Apps und Aktivitäten</p>
      </div>

      {/* Stat Cards — 6 Spalten */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
        <StatCard
          label="Apps gesamt" value={stats.total} sparkColor="#3B82F6"
          iconBg="rgba(37,99,232,0.15)" iconColor="#2563E8" trend="+2"
          iconPath={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>}
        />
        <StatCard
          label="Produktion" value={stats.production} sparkColor="#10B981"
          iconBg="rgba(16,185,129,0.15)" iconColor="#10B981"
          iconPath={<><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
        />
        <StatCard
          label="Entwicklung" value={stats.development} sparkColor="#60A5FA"
          iconBg="rgba(59,130,246,0.15)" iconColor="#60A5FA"
          iconPath={<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>}
        />
        <StatCard
          label="Testing" value={stats.testing} sparkColor="#F59E0B"
          iconBg="rgba(245,158,11,0.15)" iconColor="#F59E0B"
          iconPath={<><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11m0 0H5a2 2 0 00-2-2m6 2v5a2 2 0 002 2h2a2 2 0 002-2v-5m-6 0h6"/></>}
        />
        <StatCard
          label="Wartung" value={stats.maintenance} sparkColor="#F97316"
          iconBg="rgba(249,115,22,0.15)" iconColor="#FB923C"
          iconPath={<><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>}
        />
        <StatCard
          label="Archiviert" value={stats.archived} sparkColor="#6B7280"
          iconBg="rgba(107,114,128,0.12)" iconColor="#9CA3AF"
          iconPath={<><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>}
        />
      </div>

      {/* Bottom Grid — 3 Spalten */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, flex: 1 }}>
        <StatusDonut stats={stats} />
        <TopApps apps={topApps} total={stats.total} />
        <ActivityFeed items={recentActivity} />
      </div>
    </div>
  );
}
