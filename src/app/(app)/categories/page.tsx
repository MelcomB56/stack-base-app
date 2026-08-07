import { db } from "@/lib/db";
import { CategoriesManager } from "@/components/categories/CategoriesManager";
import { requirePermission } from "@/lib/page-guard";

export default async function CategoriesPage() {
  await requirePermission("categories.read");
  const categories = await db.category.findMany({
    include: { _count: { select: { apps: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return <CategoriesManager initial={categories} />;
}
