import { db } from "@/lib/db";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { requirePermission } from "@/lib/page-guard";

function dailyBuckets(items: { createdAt: Date }[], days = 7): number[] {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const dayStr = d.toISOString().slice(0, 10);
    return items.filter((x) => x.createdAt.toISOString().slice(0, 10) === dayStr).length;
  });
}

export default async function DashboardPage() {
  await requirePermission("apps.read");
  const currentMonth  = new Date().toISOString().slice(0, 7);
  const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
  const oneDayAgo     = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    byStatus,
    apps,
    recentActivity,
    activityLogs7d,
    incidents7d,
    openIncidents,
    healthToday,
    costCurrent,
  ] = await Promise.all([
    db.app.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { status: true } }),

    db.app.findMany({
      where: { deletedAt: null },
      select: {
        id: true, name: true, slug: true, status: true, urlProd: true, logoUrl: true,
        incidents: { where: { status: { not: "RESOLVED" } }, select: { id: true } },
        healthChecks: {
          orderBy: { checkedAt: "desc" }, take: 1,
          select: { status: true, responseTime: true, checkedAt: true },
        },
      },
      orderBy: { name: "asc" },
    }),

    db.activityLog.findMany({
      orderBy: { createdAt: "desc" }, take: 10,
      include: {
        app:  { select: { name: true, slug: true } },
        user: { select: { name: true } },
      },
    }),

    db.activityLog.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),

    db.incident.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),

    db.incident.findMany({
      where: { status: { not: "RESOLVED" }, app: { deletedAt: null } },
      select: {
        id: true, title: true, severity: true, status: true, createdAt: true,
        app: { select: { name: true, slug: true } },
      },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      take: 6,
    }),

    db.healthCheck.count({ where: { checkedAt: { gte: oneDayAgo } } }),

    db.appCost.aggregate({ where: { month: currentMonth }, _sum: { amount: true } }),
  ]);

  const statusMap      = Object.fromEntries(byStatus.map((s) => [s.status, s._count.status]));
  const total          = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const productionUp   = apps.filter((a) => a.status === "PRODUCTION" && a.healthChecks[0]?.status === "UP").length;
  const openIncidentCount = openIncidents.length;

  return (
    <DashboardClient
      stats={{
        total,
        production:  statusMap["PRODUCTION"]  ?? 0,
        development: statusMap["DEVELOPMENT"] ?? 0,
        testing:     statusMap["TESTING"]     ?? 0,
        maintenance: statusMap["MAINTENANCE"] ?? 0,
        archived:    statusMap["ARCHIVED"]    ?? 0,
        productionUp,
        openIncidents: openIncidentCount,
        healthToday,
        costCurrentMonth: Number(costCurrent._sum.amount ?? 0),
        costMonth: currentMonth,
        activitySpark: dailyBuckets(activityLogs7d),
        incidentSpark: dailyBuckets(incidents7d),
      }}
      apps={apps.map((a) => ({
        id: a.id, name: a.name, slug: a.slug, status: a.status,
        urlProd: a.urlProd ?? null, logoUrl: a.logoUrl ?? null,
        openIncidents: a.incidents.length,
        health: a.healthChecks[0]
          ? { status: a.healthChecks[0].status, responseTime: a.healthChecks[0].responseTime ?? null, checkedAt: a.healthChecks[0].checkedAt.toISOString() }
          : null,
      }))}
      openIncidents={openIncidents.map((i) => ({
        id: i.id, title: i.title, severity: i.severity, status: i.status,
        createdAt: i.createdAt.toISOString(),
        appName: i.app.name, appSlug: i.app.slug,
      }))}
      recentActivity={recentActivity.map((a) => ({
        id: a.id, action: a.action,
        appName: a.app?.name ?? null, appSlug: a.app?.slug ?? null,
        userName: a.user?.name ?? "System", createdAt: a.createdAt.toISOString(),
      }))}
    />
  );
}
