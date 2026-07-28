"use client";

import Link from "next/link";
import {
  ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, Tooltip,
} from "recharts";
import { Grid2X2, CheckCircle2, Code2, FlaskConical, Wrench, Archive, Activity, TrendingUp } from "lucide-react";

// ─── Typen ───────────────────────────────────────────────────────────────────

type Stats = {
  total: number; production: number; development: number;
  testing: number; maintenance: number; archived: number;
};
type ActivityEntry = {
  id: string; action: string; appName: string | null;
  appSlug: string | null; userName: string; createdAt: string;
};
type TopApp = { name: string; status: string; slug: string };

// ─── Sparkline-Mock (wird später durch echte Zeitreihendaten ersetzt) ────────

function makeSpark(base: number) {
  return Array.from({ length: 10 }, (_, i) => ({
    v: Math.max(0, base + Math.round((Math.random() - 0.45) * (base * 0.4 + 2) * (i / 5 + 0.5))),
  }));
}

// ─── Stat-Karte mit Sparkline ─────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, sparkColor, trend,
}: {
  label: string; value: number; icon: React.ElementType;
  color: string; sparkColor: string; trend?: string;
}) {
  const spark = makeSpark(value);
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-border/60 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={15} />
        </div>
        {trend && (
          <span className="text-[10px] text-success flex items-center gap-0.5">
            <TrendingUp size={10} />
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
      <div className="h-10 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={spark}>
            <Line
              type="monotone" dataKey="v" stroke={sparkColor}
              strokeWidth={1.5} dot={false} isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Donut-Chart ──────────────────────────────────────────────────────────────

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
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm font-semibold mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-primary inline-block" />
        Status-Übersicht
      </p>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={empty ? [{ name: "Leer", value: 1 }] : data}
                cx="50%" cy="50%"
                innerRadius={38} outerRadius={54}
                dataKey="value"
                paddingAngle={2}
                isAnimationActive={false}
              >
                {empty
                  ? <Cell fill="oklch(0.165 0.035 256)" />
                  : data.map((d, i) => <Cell key={i} fill={d.color} />)
                }
              </Pie>
              {!empty && <Tooltip
                contentStyle={{ background: "#111C2D", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: "#EDF2F7" }}
              />}
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold">{stats.total}</span>
            <span className="text-[10px] text-muted-foreground">Gesamt</span>
          </div>
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          {[
            { label: "Produktion",  value: stats.production,  color: DONUT_COLORS.production },
            { label: "Entwicklung", value: stats.development, color: DONUT_COLORS.development },
            { label: "Testing",     value: stats.testing,     color: DONUT_COLORS.testing },
            { label: "Wartung",     value: stats.maintenance, color: DONUT_COLORS.maintenance },
            { label: "Archiviert",  value: stats.archived,    color: DONUT_COLORS.archived },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-muted-foreground flex-1">{label}</span>
              <span className="font-semibold tabular-nums">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Top Apps ────────────────────────────────────────────────────────────────

const STATUS_BAR_COLOR: Record<string, string> = {
  PRODUCTION:  "#10B981",
  DEVELOPMENT: "#3B82F6",
  TESTING:     "#F59E0B",
  MAINTENANCE: "#F97316",
  ARCHIVED:    "#6B7280",
};

function TopApps({ apps, total }: { apps: TopApp[]; total: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm font-semibold mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-cyan inline-block" style={{ background: "#22D3EE" }} />
        Top Apps
      </p>
      {apps.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Noch keine Apps vorhanden</p>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const pct = total > 0 ? Math.round((1 / Math.max(total, 1)) * 100) : 0;
            const barColor = STATUS_BAR_COLOR[app.status] ?? "#6B7280";
            return (
              <Link key={app.slug} href={`/apps/${app.slug}`} className="block group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium group-hover:text-primary transition-colors truncate max-w-[70%]">
                    {app.name}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(20, pct)}%`, background: barColor }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Aktivitäts-Feed ─────────────────────────────────────────────────────────

const ACTION_LABEL: Record<string, string> = {
  "app.created": "angelegt",
  "app.updated": "aktualisiert",
  "app.deleted": "gelöscht",
  "status.changed": "Status geändert",
};

function timeAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1)   return "gerade eben";
  if (diff < 60)  return `vor ${diff} Min.`;
  const h = Math.round(diff / 60);
  if (h < 24)     return `vor ${h} Std.`;
  return `vor ${Math.round(h / 24)} Tagen`;
}

function ActivityFeed({ items }: { items: ActivityEntry[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
      <p className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Activity size={14} className="text-primary" />
        Letzte Aktivitäten
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Noch keine Aktivitäten</p>
      ) : (
        <div className="space-y-3 flex-1">
          {items.map((entry) => (
            <div key={entry.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                <div className="w-px flex-1 bg-border mt-1" />
              </div>
              <div className="pb-3 min-w-0">
                <p className="text-xs leading-snug">
                  <span className="font-semibold">{entry.userName}</span>
                  {" hat "}
                  {entry.appName && entry.appSlug ? (
                    <Link href={`/apps/${entry.appSlug}`} className="text-primary hover:underline">
                      {entry.appName}
                    </Link>
                  ) : "eine App"}
                  {" "}
                  <span className="text-muted-foreground">
                    {ACTION_LABEL[entry.action] ?? entry.action}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(entry.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Haupt-Export ────────────────────────────────────────────────────────────

export function DashboardClient({
  stats, recentActivity, topApps,
}: {
  stats: Stats;
  recentActivity: ActivityEntry[];
  topApps: TopApp[];
}) {
  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Übersicht aller Apps und Aktivitäten</p>
      </div>

      {/* Stats-Kacheln */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Apps gesamt" value={stats.total}
          icon={Grid2X2} color="bg-primary/15 text-primary" sparkColor="#3B82F6"
        />
        <StatCard
          label="Produktion" value={stats.production}
          icon={CheckCircle2} color="bg-success/15 text-success" sparkColor="#10B981"
        />
        <StatCard
          label="Entwicklung" value={stats.development}
          icon={Code2} color="bg-blue-500/15 text-blue-400" sparkColor="#60A5FA"
        />
        <StatCard
          label="Testing" value={stats.testing}
          icon={FlaskConical} color="bg-warning/15 text-warning" sparkColor="#F59E0B"
        />
        <StatCard
          label="Wartung" value={stats.maintenance}
          icon={Wrench} color="bg-orange-500/15 text-orange-400" sparkColor="#F97316"
        />
        <StatCard
          label="Archiviert" value={stats.archived}
          icon={Archive} color="bg-muted text-muted-foreground" sparkColor="#6B7280"
        />
      </div>

      {/* Hauptbereich */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatusDonut stats={stats} />
        <TopApps apps={topApps} total={stats.total} />
        <ActivityFeed items={recentActivity} />
      </div>
    </div>
  );
}
