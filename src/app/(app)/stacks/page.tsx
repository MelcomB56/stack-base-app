import { db } from "@/lib/db";
import { StacksManager } from "@/components/stacks/StacksManager";
import { requirePermission } from "@/lib/page-guard";

export default async function StacksPage() {
  await requirePermission("stacks.read");
  const stacks = await db.stack.findMany({
    include: {
      technologies: { include: { technology: true } },
      _count: { select: { apps: true } },
    },
    orderBy: { name: "asc" },
  });

  return <StacksManager initial={stacks} />;
}
