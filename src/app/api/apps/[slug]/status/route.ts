import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { changeStatusSchema } from "@/lib/validations/app";

// PATCH /api/apps/[slug]/status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const app = await db.app.findFirst({ where: { slug, deletedAt: null } });
  if (!app) return apiError("App nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = changeStatusSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const { status, maintenanceNote, maintenanceEnd } = parsed.data;

  if (status === "MAINTENANCE" && !maintenanceNote) {
    return apiError("Wartungshinweis ist Pflicht bei Status MAINTENANCE");
  }

  const firstUser = await db.user.findFirst();

  const [updated] = await db.$transaction([
    db.app.update({
      where: { id: app.id },
      data: {
        status,
        maintenanceNote: status === "MAINTENANCE" ? maintenanceNote : null,
        maintenanceEnd:
          status === "MAINTENANCE" && maintenanceEnd
            ? new Date(maintenanceEnd)
            : null,
      },
    }),
    db.appStatusHistory.create({
      data: {
        appId: app.id,
        oldStatus: app.status,
        newStatus: status,
        changedById: firstUser!.id,
        note: maintenanceNote,
      },
    }),
    ...(firstUser
      ? [
          db.activityLog.create({
            data: {
              appId: app.id,
              userId: firstUser.id,
              action: "status.changed",
              entityType: "app",
              entityId: app.id,
              metadata: { oldStatus: app.status, newStatus: status },
            },
          }),
        ]
      : []),
  ]);

  return Response.json(updated);
}
