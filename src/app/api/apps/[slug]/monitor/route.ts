import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { auth } from "@/auth";
import { z } from "zod";

const urlOrEmpty = z.union([z.literal(""), z.string().url()]);

const createSchema = z.object({
  label: z.string().min(1).max(100).default("Production"),
  enabled: z.boolean().default(true),
  checkUrl: urlOrEmpty,
  intervalMin: z.number().int().min(1).max(60).default(5),
  timeoutSec: z.number().int().min(1).max(60).default(10),
  expectedStatus: z.number().int().min(100).max(599).default(200),
});

const updateSchema = createSchema.partial();

// GET — alle Configs + letzte Checks pro Config
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  const configs = await db.monitorConfig.findMany({
    where: { appId: app.id },
    orderBy: { createdAt: "asc" },
    include: {
      healthChecks: {
        orderBy: { checkedAt: "desc" },
        take: 288, // 24h bei 5-min-Intervall
      },
    },
  });

  return Response.json(configs);
}

// POST — neue Config anlegen
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return apiError("Nicht authentifiziert", 401);

  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const config = await db.monitorConfig.create({
    data: { appId: app.id, ...parsed.data },
    include: { healthChecks: { orderBy: { checkedAt: "desc" }, take: 10 } },
  });
  return Response.json(config, { status: 201 });
}

// PATCH ?id= — bestehende Config aktualisieren
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return apiError("Nicht authentifiziert", 401);

  const { slug } = await params;
  const url = new URL(req.url);
  const configId = url.searchParams.get("id");
  if (!configId) return apiError("Config-ID fehlt");

  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const updated = await db.monitorConfig.update({
    where: { id: configId, appId: app.id },
    data: parsed.data,
    include: { healthChecks: { orderBy: { checkedAt: "desc" }, take: 288 } },
  });
  return Response.json(updated);
}

// DELETE ?id= — Config löschen
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return apiError("Nicht authentifiziert", 401);

  const { slug } = await params;
  const url = new URL(req.url);
  const configId = url.searchParams.get("id");
  if (!configId) return apiError("Config-ID fehlt");

  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  await db.monitorConfig.delete({ where: { id: configId, appId: app.id } });
  return new Response(null, { status: 204 });
}
