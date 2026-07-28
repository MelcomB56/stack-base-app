import { db } from "@/lib/db";
import { AppStatus } from "@/generated/prisma/client";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const [total, byStatus, recentActivity, topApps] = await Promise.all([
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
