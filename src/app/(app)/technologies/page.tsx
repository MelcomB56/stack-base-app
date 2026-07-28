import { db } from "@/lib/db";
import { TechnologiesManager } from "@/components/technologies/TechnologiesManager";

export default async function TechnologiesPage() {
  const technologies = await db.technology.findMany({
    include: { _count: { select: { apps: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return <TechnologiesManager initial={technologies} />;
}
