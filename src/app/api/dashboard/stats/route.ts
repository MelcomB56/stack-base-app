import { db } from "@/lib/db";
import { AppStatus } from "@/generated/prisma/client";

export async function GET() {
  const [total, byStatus, recentActivities, maintenance] = await Promise.all([
    db.app.count({ where: { deletedAt: null } }),
    db.app.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true,
    }),
    db.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, avatarUrl: true } },
        app: { select: { name: true, slug: true } },
      },
    }),
    db.app.findMany({
      where: { status: AppStatus.MAINTENANCE, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        maintenanceNote: true,
        maintenanceEnd: true,
      },
    }),
  ]);

  const statusMap = Object.fromEntries(
    byStatus.map((s) => [s.status, s._count])
  );

  return Response.json({
    total,
    byStatus: {
      production: statusMap["PRODUCTION"] ?? 0,
      development: statusMap["DEVELOPMENT"] ?? 0,
      testing: statusMap["TESTING"] ?? 0,
      maintenance: statusMap["MAINTENANCE"] ?? 0,
      archived: statusMap["ARCHIVED"] ?? 0,
    },
    recentActivities,
    maintenance,
  });
}
