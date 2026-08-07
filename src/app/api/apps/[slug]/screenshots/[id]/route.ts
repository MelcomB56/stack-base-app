import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";
import { deleteFile, objectNameFromUrl } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, id } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.screenshot.findFirst({ where: { id, appId: app.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = updateSchema.parse(await req.json());
  const updated = await db.screenshot.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await auth();
  const errD = await guard(session, "app_screenshots.delete");
  if (errD) return errD;

  const { slug, id } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.screenshot.findFirst({ where: { id, appId: app.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.screenshot.delete({ where: { id } });
  await deleteFile(objectNameFromUrl(existing.fileUrl));
  await logActivity({ appId: app.id, userId: session!.user!.id, action: "screenshot.deleted", entityType: "screenshot", entityId: id, metadata: { title: existing.title } });

  return NextResponse.json({ ok: true });
}
