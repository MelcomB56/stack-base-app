import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type"); // apps | categories | tags | technologies

  if (q.length < 2) {
    return Response.json({ apps: [], categories: [], tags: [], technologies: [] });
  }

  const contains = q;
  const mode = "insensitive" as const;

  const [apps, categories, tags, technologies] = await Promise.all([
    !type || type === "apps"
      ? db.app.findMany({
          where: {
            deletedAt: null,
            OR: [
              { name: { contains, mode } },
              { shortDesc: { contains, mode } },
            ],
          },
          select: { id: true, name: true, slug: true, shortDesc: true, status: true, logoUrl: true },
          take: 10,
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),

    !type || type === "categories"
      ? db.category.findMany({
          where: { name: { contains, mode } },
          select: { id: true, name: true, slug: true, color: true, icon: true },
          take: 5,
        })
      : Promise.resolve([]),

    !type || type === "tags"
      ? db.tag.findMany({
          where: { name: { contains, mode } },
          select: { id: true, name: true, slug: true, color: true },
          take: 5,
        })
      : Promise.resolve([]),

    !type || type === "technologies"
      ? db.technology.findMany({
          where: { name: { contains, mode } },
          select: { id: true, name: true, slug: true, category: true, logoUrl: true },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  return Response.json({ apps, categories, tags, technologies });
}
