import { db } from "@/lib/db";
import { TagsManager } from "@/components/tags/TagsManager";

export default async function TagsPage() {
  const tags = await db.tag.findMany({
    include: { _count: { select: { apps: true } } },
    orderBy: { name: "asc" },
  });

  return <TagsManager initial={tags} />;
}
