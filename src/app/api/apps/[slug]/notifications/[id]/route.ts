import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";
import { z } from "zod";

const patchSchema = z.object({
  onStatusChange: z.boolean().optional(),
  onIncident: z.boolean().optional(),
  onRelease: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await auth();
  const err = await guard(session, "apps.read");
  if (err) return err;

  const { slug, id } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.notificationSetting.findFirst({ where: { id, appId: app.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = patchSchema.parse(await req.json());
  const updated = await db.notificationSetting.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await auth();
  const errD = await guard(session, "apps.read");
  if (errD) return errD;

  const { slug, id } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.notificationSetting.findFirst({ where: { id, appId: app.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.notificationSetting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
