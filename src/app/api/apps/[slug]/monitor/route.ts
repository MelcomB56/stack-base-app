import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { auth } from "@/auth";
import { z } from "zod";

const urlOrEmpty = z.union([z.literal(""), z.string().url()]);

const configSchema = z.object({
  enabled: z.boolean().optional(),
  intervalMin: z.number().int().min(1).max(60).optional(),
  timeoutSec: z.number().int().min(1).max(60).optional(),
  checkUrl: urlOrEmpty.optional(),
  expectedStatus: z.number().int().min(100).max(599).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  const [config, checks] = await Promise.all([
    db.monitorConfig.findUnique({ where: { appId: app.id } }),
    db.healthCheck.findMany({
      where: { appId: app.id },
      orderBy: { checkedAt: "desc" },
      take: 288, // 24h bei 5-min-Intervall
    }),
  ]);

  return Response.json({ config, checks });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return apiError("Nicht authentifiziert", 401);

  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = configSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const config = await db.monitorConfig.upsert({
    where: { appId: app.id },
    create: { appId: app.id, ...parsed.data },
    update: parsed.data,
  });
  return Response.json(config);
}
