import { db } from "@/lib/db";
import { AnnouncementsClient } from "@/components/announcements/AnnouncementsClient";
import { requirePermission } from "@/lib/page-guard";

export default async function AnnouncementsPage() {
  await requirePermission("announcements.read");
  const announcements = await db.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return <AnnouncementsClient initial={announcements.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))} />;
}
