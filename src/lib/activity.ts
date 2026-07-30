import "server-only";
import { db } from "@/lib/db";

export async function logActivity({
  appId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  appId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.activityLog.create({
      data: { appId: appId ?? null, userId: userId ?? null, action, entityType, entityId, metadata },
    });
  } catch {
    // Logging soll nie die eigentliche Aktion blockieren
  }
}
