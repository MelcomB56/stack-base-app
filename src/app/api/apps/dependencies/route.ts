import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";

export async function GET() {
  const session = await auth();
  const err = await guard(session, "app_dependencies.read");
  if (err) return err;

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
