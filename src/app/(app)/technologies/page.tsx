import { db } from "@/lib/db";
import { TechnologiesManager } from "@/components/technologies/TechnologiesManager";
import { requirePermission } from "@/lib/page-guard";

export default async function TechnologiesPage() {
  await requirePermission("technologies.read");
  const technologies = await db.technology.findMany({
    include: { _count: { select: { apps: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return <TechnologiesManager initial={technologies} />;
}
