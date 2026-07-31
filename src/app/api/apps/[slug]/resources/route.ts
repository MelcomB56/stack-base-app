import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkResourceForApp } from "@/worker/resourcemonitor";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const app = await db.app.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, dockerHost: true, dockerContainer: true },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [latest, history] = await Promise.all([
    db.resourceReading.findFirst({
      where: { appId: app.id },
      orderBy: { readAt: "desc" },
    }),
    db.resourceReading.findMany({
      where: { appId: app.id, readAt: { gte: since } },
      orderBy: { readAt: "asc" },
      select: { readAt: true, cpuPercent: true, memPercent: true, memUsed: true, memLimit: true },
    }),
  ]);

  return NextResponse.json({
    latest: latest
      ? { ...latest, memUsed: latest.memUsed?.toString(), memLimit: latest.memLimit?.toString(), netIn: latest.netIn?.toString(), netOut: latest.netOut?.toString() }
      : null,
    history: history.map((r) => ({
      ...r,
      memUsed: r.memUsed?.toString(),
      memLimit: r.memLimit?.toString(),
    })),
    dockerHost: app.dockerHost,
    dockerContainer: app.dockerContainer,
  });
}

export async function POST(_req: Request, { params }: Params) {
  const { slug } = await params;
  const app = await db.app.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, dockerHost: true, dockerContainer: true },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!app.dockerHost || !app.dockerContainer) {
    return NextResponse.json({ error: "Kein Docker-Host oder Container konfiguriert" }, { status: 400 });
  }

  try {
    await checkResourceForApp(db, app.id, app.dockerHost, app.dockerContainer);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  const latest = await db.resourceReading.findFirst({
    where: { appId: app.id },
    orderBy: { readAt: "desc" },
  });

  return NextResponse.json({
    latest: latest
      ? { ...latest, memUsed: latest.memUsed?.toString(), memLimit: latest.memLimit?.toString(), netIn: latest.netIn?.toString(), netOut: latest.netOut?.toString() }
      : null,
  });
}
