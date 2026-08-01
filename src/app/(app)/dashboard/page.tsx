import { db } from "@/lib/db";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [byStatus, recentActivity, apps, costCurrent, openIncidentCount] = await Promise.all([
    db.app.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { status: true },
    }),
    db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        app: { select: { name: true, slug: true } },
        user: { select: { name: true } },
      },
    }),
    db.app.findMany({
      where: { deletedAt: null },
      select: {
        id: true, name: true, slug: true, status: true, urlProd: true, logoUrl: true,
        incidents: {
          where: { status: { not: "RESOLVED" } },
          select: { id: true },
        },
        healthChecks: {
          orderBy: { checkedAt: "desc" },
          take: 1,
          select: { status: true, responseTime: true, checkedAt: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.appCost.aggregate({ where: { month: currentMonth }, _sum: { amount: true } }),
    db.incident.count({ where: { status: { not: "RESOLVED" }, app: { deletedAt: null } } }),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count.status]));
  const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

  const productionUp = apps.filter(
    (a) => a.status === "PRODUCTION" && a.healthChecks[0]?.status === "UP"
  ).length;

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
        costCurrentMonth: Number(costCurrent._sum.amount ?? 0),
        costMonth: currentMonth,
      }}
      apps={apps.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        status: a.status,
        urlProd: a.urlProd ?? null,
        logoUrl: a.logoUrl ?? null,
        openIncidents: a.incidents.length,
        health: a.healthChecks[0]
          ? { status: a.healthChecks[0].status, responseTime: a.healthChecks[0].responseTime ?? null, checkedAt: a.healthChecks[0].checkedAt.toISOString() }
          : null,
      }))}
      recentActivity={recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        appName: a.app?.name ?? null,
        appSlug: a.app?.slug ?? null,
        userName: a.user?.name ?? "System",
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  );
}
