import { db } from "@/lib/db";
import { CategoriesManager } from "@/components/categories/CategoriesManager";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    include: { _count: { select: { apps: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return <CategoriesManager initial={categories} />;
}
