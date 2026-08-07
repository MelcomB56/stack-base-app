import { db } from "@/lib/db";
import { TagsManager } from "@/components/tags/TagsManager";
import { requirePermission } from "@/lib/page-guard";

export default async function TagsPage() {
  await requirePermission("tags.read");
  const tags = await db.tag.findMany({
    include: { _count: { select: { apps: true } } },
    orderBy: { name: "asc" },
  });

  return <TagsManager initial={tags} />;
}
