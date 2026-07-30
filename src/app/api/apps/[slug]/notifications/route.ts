import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";

const upsertSchema = z.object({
  email: z.string().email(),
  onStatusChange: z.boolean().optional(),
  onIncident: z.boolean().optional(),
  onRelease: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = await db.notificationSetting.findMany({
    where: { appId: app.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(settings);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = upsertSchema.parse(await req.json());

  const setting = await db.notificationSetting.upsert({
    where: { appId_email: { appId: app.id, email: body.email } },
    create: {
      appId: app.id,
      email: body.email,
      onStatusChange: body.onStatusChange ?? true,
      onIncident: body.onIncident ?? true,
      onRelease: body.onRelease ?? false,
    },
    update: {
      onStatusChange: body.onStatusChange ?? true,
      onIncident: body.onIncident ?? true,
      onRelease: body.onRelease ?? false,
    },
  });

  return NextResponse.json(setting, { status: 201 });
}
