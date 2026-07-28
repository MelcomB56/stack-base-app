import { db } from "@/lib/db";
import { StacksManager } from "@/components/stacks/StacksManager";

export default async function StacksPage() {
  const stacks = await db.stack.findMany({
    include: {
      technologies: { include: { technology: true } },
      _count: { select: { apps: true } },
    },
    orderBy: { name: "asc" },
  });

  return <StacksManager initial={stacks} />;
}
