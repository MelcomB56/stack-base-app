import { db } from "@/lib/db";
import { NewAppForm } from "@/components/apps/NewAppForm";
import { requirePermission } from "@/lib/page-guard";

export default async function NewAppPage() {
  await requirePermission("apps.create");
  const [categories, stacks, technologies, tags, targets] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.stack.findMany({ orderBy: { name: "asc" } }),
    db.technology.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
    db.deploymentTarget.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <NewAppForm options={{ categories, stacks, technologies, tags, targets }} />;
}
