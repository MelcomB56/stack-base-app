import { db } from "@/lib/db";
import { AppStatus } from "@/generated/prisma/client";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const prevMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();

  const [total, byStatus, recentActivity, topApps, costCurrent, costPrev] = await Promise.all([
    db.app.count({ where: { deletedAt: null } }),
    db.app.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { status: true },
    }),
    db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        app: { select: { name: true, slug: true } },
        user: { select: { name: true } },
      },
    }),
    db.app.findMany({
      where: { deletedAt: null, status: { not: AppStatus.ARCHIVED } },
      select: { name: true, status: true, slug: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.appCost.aggregate({ where: { month: currentMonth }, _sum: { amount: true } }),
    db.appCost.aggregate({ where: { month: prevMonth }, _sum: { amount: true } }),
  ]);

  const statusMap = Object.fromEntries(
    byStatus.map((s) => [s.status, s._count.status])
  );

  return (
    <DashboardClient
      stats={{
        total,
        production:  statusMap["PRODUCTION"]  ?? 0,
        development: statusMap["DEVELOPMENT"] ?? 0,
        testing:     statusMap["TESTING"]     ?? 0,
        maintenance: statusMap["MAINTENANCE"] ?? 0,
        archived:    statusMap["ARCHIVED"]    ?? 0,
        costCurrentMonth: Number(costCurrent._sum.amount ?? 0),
        costPrevMonth:    Number(costPrev._sum.amount ?? 0),
        costMonth: currentMonth,
      }}
      recentActivity={recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        appName: a.app?.name ?? null,
        appSlug: a.app?.slug ?? null,
        userName: a.user?.name ?? "System",
        createdAt: a.createdAt.toISOString(),
      }))}
      topApps={topApps}
    />
  );
}
