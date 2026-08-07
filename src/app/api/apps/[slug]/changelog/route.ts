import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { createChangelogEntrySchema } from "@/lib/validations/changelog";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  const err = await guard(session, "app_changelog.read");
  if (err) return err;
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null } });
  if (!app) return apiError("App nicht gefunden", 404);

  const { searchParams } = req.nextUrl;
  const releaseId = searchParams.get("releaseId");
  const type = searchParams.get("type");

  const entries = await db.changelogEntry.findMany({
    where: {
      appId: app.id,
      ...(releaseId ? { releaseId } : {}),
      ...(type ? { type: type as never } : {}),
    },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    include: {
      release: { select: { id: true, version: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return Response.json(entries);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  const errP = await guard(session, "app_changelog.create");
  if (errP) return errP;
  const userId = session!.user!.id as string;

  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null } });
  if (!app) return apiError("App nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = createChangelogEntrySchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  if (parsed.data.releaseId) {
    const release = await db.release.findFirst({
      where: { id: parsed.data.releaseId, appId: app.id },
    });
    if (!release) return apiError("Release nicht gefunden", 404);
  }

  const entry = await db.changelogEntry.create({
    data: {
      appId: app.id,
      createdById: userId,
      type: parsed.data.type,
      description: parsed.data.description,
      ...(parsed.data.entryDate ? { entryDate: new Date(parsed.data.entryDate) } : {}),
      ...(parsed.data.releaseId ? { releaseId: parsed.data.releaseId } : {}),
    },
    include: {
      release: { select: { id: true, version: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await logActivity({ appId: app.id, userId, action: "changelog.created", entityType: "changelog", entityId: entry.id, metadata: { type: entry.type, description: entry.description.slice(0, 80) } });

  return Response.json(entry, { status: 201 });
}
