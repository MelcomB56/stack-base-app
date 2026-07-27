import { db } from "@/lib/db";
import { AppStatus } from "@/generated/prisma/client";
import { AppStatusBadge } from "@/components/apps/AppStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid2X2, CheckCircle2, Wrench, Archive, FlaskConical, Code2, Activity } from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  const [total, byStatus, recentActivities, maintenance] = await Promise.all([
    db.app.count({ where: { deletedAt: null } }),
    db.app.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
    db.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        app: { select: { name: true, slug: true } },
      },
    }),
    db.app.findMany({
      where: { status: AppStatus.MAINTENANCE, deletedAt: null },
      select: { id: true, name: true, slug: true, maintenanceNote: true, maintenanceEnd: true },
    }),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
  return { total, statusMap, recentActivities, maintenance };
}

const STATUS_CARDS = [
  { key: "PRODUCTION", label: "Produktion", icon: CheckCircle2, color: "text-emerald-400" },
  { key: "DEVELOPMENT", label: "Entwicklung", icon: Code2, color: "text-blue-400" },
  { key: "TESTING", label: "Testing", icon: FlaskConical, color: "text-yellow-400" },
  { key: "MAINTENANCE", label: "Wartung", icon: Wrench, color: "text-orange-400" },
  { key: "ARCHIVED", label: "Archiviert", icon: Archive, color: "text-zinc-400" },
];

function formatTime(date: Date) {
  return new Intl.RelativeTimeFormat("de", { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / 60000),
    "minute"
  );
}

export default async function DashboardPage() {
  const { total, statusMap, recentActivities, maintenance } = await getDashboardData();

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Übersicht aller Apps und Aktivitäten</p>
      </div>

      {/* Total + Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="col-span-2 sm:col-span-1 border-border bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/15">
              <Grid2X2 size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{total}</p>
              <p className="text-xs text-muted-foreground">Apps gesamt</p>
            </div>
          </CardContent>
        </Card>

        {STATUS_CARDS.map(({ key, label, icon: Icon, color }) => (
          <Card key={key} className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon size={16} className={color} />
              <div>
                <p className="text-xl font-bold tabular-nums">{statusMap[key] ?? 0}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wartung */}
        {maintenance.length > 0 && (
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-400">
                <Wrench size={14} />
                Apps in Wartung ({maintenance.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {maintenance.map((app) => (
                <Link
                  key={app.id}
                  href={`/apps/${app.slug}`}
                  className="flex items-start justify-between gap-2 p-2 rounded-md hover:bg-orange-500/10 transition-colors"
                >
                  <span className="text-sm font-medium">{app.name}</span>
                  {app.maintenanceNote && (
                    <span className="text-xs text-muted-foreground text-right max-w-[60%] truncate">
                      {app.maintenanceNote}
                    </span>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Aktivitäten */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity size={14} className="text-primary" />
              Letzte Aktivitäten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Noch keine Aktivitäten</p>
            ) : (
              recentActivities.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-medium">{log.user?.name ?? "System"}</span>
                      {" · "}
                      <span className="text-muted-foreground">{log.action}</span>
                      {log.app && (
                        <>
                          {" — "}
                          <Link
                            href={`/apps/${log.app.slug}`}
                            className="text-primary hover:underline"
                          >
                            {log.app.name}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
