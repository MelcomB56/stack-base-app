import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, uniqueAppSlug } from "@/lib/server-utils";
import { updateAppSchema } from "@/lib/validations/app";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";

const APP_INCLUDE = {
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  stacks: { include: { stack: true } },
  technologies: { include: { technology: true } },
  createdBy: { select: { id: true, name: true, avatarUrl: true } },
} as const;

async function findApp(slug: string) {
  return db.app.findFirst({ where: { slug, deletedAt: null } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const err = await guard(session, "apps.read");
  if (err) return err;
  const { slug } = await params;
  const app = await db.app.findFirst({
    where: { slug, deletedAt: null },
    include: APP_INCLUDE,
  });
  if (!app) return apiError("App nicht gefunden", 404);
  return Response.json(app);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const err = await guard(session, "apps.update");
  if (err) return err;
  const userId = session!.user!.id as string;

  const { slug } = await params;
  const app = await findApp(slug);
  if (!app) return apiError("App nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = updateAppSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const { categoryIds, tagIds, stackIds, technologyIds, name, ...data } = parsed.data;

  let newSlug = app.slug;
  if (name && name !== app.name) {
    newSlug = await uniqueAppSlug(name);
  }

  const updated = await db.app.update({
    where: { id: app.id },
    data: {
      ...data,
      ...(name && { name, slug: newSlug }),
      ...(categoryIds !== undefined && {
        categories: { deleteMany: {}, create: categoryIds.map((id) => ({ categoryId: id })) },
      }),
      ...(tagIds !== undefined && {
        tags: { deleteMany: {}, create: tagIds.map((id) => ({ tagId: id })) },
      }),
      ...(stackIds !== undefined && {
        stacks: { deleteMany: {}, create: stackIds.map((id) => ({ stackId: id })) },
      }),
      ...(technologyIds !== undefined && {
        technologies: { deleteMany: {}, create: technologyIds.map((id) => ({ technologyId: id })) },
      }),
    },
    include: APP_INCLUDE,
  });

  await db.activityLog.create({
    data: {
      appId: app.id,
      userId,
      action: "app.updated",
      entityType: "app",
      entityId: app.id,
      metadata: { changes: Object.keys(parsed.data) },
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const err = await guard(session, "apps.delete");
  if (err) return err;
  const userId = session!.user!.id as string;

  const { slug } = await params;
  const app = await findApp(slug);
  if (!app) return apiError("App nicht gefunden", 404);

  await db.app.update({ where: { id: app.id }, data: { deletedAt: new Date() } });

  await db.activityLog.create({
    data: {
      appId: app.id,
      userId,
      action: "app.deleted",
      entityType: "app",
      entityId: app.id,
      metadata: { name: app.name },
    },
  });

  return new Response(null, { status: 204 });
}
