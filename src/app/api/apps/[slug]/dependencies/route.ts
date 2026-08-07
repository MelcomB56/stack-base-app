import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";
import { z } from "zod";

const createSchema = z.object({
  dependsOnAppId: z.string().uuid().optional(),
  dependsOnName: z.string().max(100).optional(),
  relationshipType: z.enum(["REQUIRES", "USES_API", "USES_SERVICE", "CONTAINS", "PLANNED"]).default("REQUIRES"),
  description: z.string().max(255).optional(),
}).refine((d) => d.dependsOnAppId || d.dependsOnName, {
  message: "dependsOnAppId oder dependsOnName muss angegeben sein",
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const err = await guard(session, "app_dependencies.read");
  if (err) return err;
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  const [outgoing, incoming] = await Promise.all([
    db.appDependency.findMany({
      where: { appId: app.id },
      include: { dependsOnApp: { select: { id: true, name: true, slug: true, status: true } } },
    }),
    db.appDependency.findMany({
      where: { dependsOnAppId: app.id },
      include: { app: { select: { id: true, name: true, slug: true, status: true } } },
    }),
  ]);

  return Response.json({ outgoing, incoming });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const errP = await guard(session, "app_dependencies.create");
  if (errP) return errP;

  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  if (parsed.data.dependsOnAppId === app.id) return apiError("App kann nicht von sich selbst abhängen", 400);

  const dep = await db.appDependency.create({
    data: { appId: app.id, ...parsed.data },
  });
  return Response.json(dep, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const errD = await guard(session, "app_dependencies.delete");
  if (errD) return errD;

  const { slug } = await params;
  const url = new URL(req.url);
  const depId = url.searchParams.get("id");
  if (!depId) return apiError("Dependency-ID fehlt");

  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  await db.appDependency.delete({ where: { id: depId, appId: app.id } });
  return new Response(null, { status: 204 });
}
