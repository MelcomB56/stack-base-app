import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, slugify } from "@/lib/utils";
import { createCategorySchema } from "@/lib/validations/category";

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { apps: true } } },
  });
  return Response.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  const exists = await db.category.findUnique({ where: { slug } });
  if (exists) return apiError("Kategorie mit diesem Namen existiert bereits", 409);

  const category = await db.category.create({
    data: { ...parsed.data, slug },
  });
  return Response.json(category, { status: 201 });
}
