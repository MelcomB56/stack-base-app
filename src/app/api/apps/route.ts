import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, uniqueAppSlug } from "@/lib/server-utils";
import { createAppSchema } from "@/lib/validations/app";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";

const APP_INCLUDE = {
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  stacks: { include: { stack: true } },
  technologies: { include: { technology: true } },
  createdBy: { select: { id: true, name: true, avatarUrl: true } },
} as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  const err = await guard(session, "apps.read");
  if (err) return err;
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "24"));
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const tagId = searchParams.get("tagId");
  const q = searchParams.get("q");

  const where = {
    deletedAt: null,
    ...(status && { status: status as never }),
    ...(categoryId && { categories: { some: { categoryId } } }),
    ...(tagId && { tags: { some: { tagId } } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { shortDesc: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  const [apps, total] = await Promise.all([
    db.app.findMany({
      where,
      include: APP_INCLUDE,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.app.count({ where }),
  ]);

  return Response.json({ apps, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const err = await guard(session, "apps.create");
  if (err) return err;
  const userId = session!.user!.id as string;

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = createAppSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const { categoryIds, tagIds, stackIds, technologyIds, ...data } = parsed.data;
  const slug = await uniqueAppSlug(data.name);

  const app = await db.app.create({
    data: {
      ...data,
      slug,
      createdById: userId,
      categories: { create: categoryIds?.map((id) => ({ categoryId: id })) ?? [] },
      tags: { create: tagIds?.map((id) => ({ tagId: id })) ?? [] },
      stacks: { create: stackIds?.map((id) => ({ stackId: id })) ?? [] },
      technologies: { create: technologyIds?.map((id) => ({ technologyId: id })) ?? [] },
    },
    include: APP_INCLUDE,
  });

  await db.activityLog.create({
    data: {
      appId: app.id,
      userId,
      action: "app.created",
      entityType: "app",
      entityId: app.id,
      metadata: { name: app.name },
    },
  });

  return Response.json(app, { status: 201 });
}
