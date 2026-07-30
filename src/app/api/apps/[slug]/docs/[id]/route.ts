import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const doc = await db.docPage.findFirst({
    where: { id, appId: app.id },
    include: { createdBy: { select: { name: true } } },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(doc);
}

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  type: z.enum(["MANUAL", "FAQ", "API", "OTHER"]).optional(),
  isPublic: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, id } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.docPage.findFirst({ where: { id, appId: app.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = updateSchema.parse(await req.json());

  const doc = await db.docPage.update({
    where: { id },
    data: body,
    include: { createdBy: { select: { name: true } } },
  });

  await logActivity({ appId: app.id, userId: session.user?.id, action: "doc.updated", entityType: "doc", entityId: doc.id, metadata: { title: doc.title } });
  return NextResponse.json(doc);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, id } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.docPage.findFirst({ where: { id, appId: app.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.docPage.delete({ where: { id } });
  await logActivity({ appId: app.id, userId: session.user?.id, action: "doc.deleted", entityType: "doc", entityId: id, metadata: { title: existing.title } });
  return NextResponse.json({ ok: true });
}
