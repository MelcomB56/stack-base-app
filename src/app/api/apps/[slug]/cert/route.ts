import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { checkCertForApp } from "@/worker/certcheck";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;

  const app = await db.app.findUnique({ where: { slug }, select: { id: true, urlProd: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [latest, history] = await Promise.all([
    db.certCheck.findFirst({ where: { appId: app.id }, orderBy: { checkedAt: "desc" } }),
    db.certCheck.findMany({
      where: { appId: app.id },
      orderBy: { checkedAt: "desc" },
      take: 10,
      select: { id: true, status: true, daysLeft: true, checkedAt: true, errorMsg: true },
    }),
  ]);

  return NextResponse.json({ latest, history, urlProd: app.urlProd });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;

  const app = await db.app.findUnique({ where: { slug }, select: { id: true, urlProd: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!app.urlProd) return NextResponse.json({ error: "Keine Production-URL konfiguriert" }, { status: 400 });

  await checkCertForApp(db as never, app.id, app.urlProd);

  const latest = await db.certCheck.findFirst({
    where: { appId: app.id },
    orderBy: { checkedAt: "desc" },
  });

  return NextResponse.json({ ok: true, latest });
}
