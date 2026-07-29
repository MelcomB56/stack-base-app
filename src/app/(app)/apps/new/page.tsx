import { db } from "@/lib/db";
import { NewAppForm } from "@/components/apps/NewAppForm";

export default async function NewAppPage() {
  const [categories, stacks, technologies, tags] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.stack.findMany({ orderBy: { name: "asc" } }),
    db.technology.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <NewAppForm options={{ categories, stacks, technologies, tags }} />;
}
