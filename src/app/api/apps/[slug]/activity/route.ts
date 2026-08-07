import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const err = await guard(session, "activity_log.read");
  if (err) return err;
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor");
  const limit = 30;

  const logs = await db.activityLog.findMany({
    where: { appId: app.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { user: { select: { name: true } } },
  });

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    items: items.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    nextCursor,
  });
}
