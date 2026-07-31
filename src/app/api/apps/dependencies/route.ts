import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";

export async function GET() {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  const [apps, deps] = await Promise.all([
    db.app.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true, status: true, shortDesc: true },
      orderBy: { name: "asc" },
    }),
    db.appDependency.findMany({
      select: {
        id: true,
        appId: true,
        dependsOnAppId: true,
        dependsOnName: true,
        relationshipType: true,
        description: true,
      },
    }),
  ]);

  return NextResponse.json({ apps, dependencies: deps });
}
