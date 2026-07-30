import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
});

const updateSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED"]).optional(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  const incidents = await db.incident.findMany({
    where: { appId: app.id },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  return Response.json(incidents);
}

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

  const incident = await db.incident.create({
    data: { appId: app.id, ...parsed.data, autoCreated: false },
  });
  await logActivity({ appId: app.id, userId: session.user?.id, action: "incident.created", entityType: "incident", entityId: incident.id, metadata: { title: incident.title, severity: incident.severity } });
  return Response.json(incident, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return apiError("Nicht authentifiziert", 401);

  const { slug } = await params;
  const url = new URL(req.url);
  const incidentId = url.searchParams.get("id");
  if (!incidentId) return apiError("Incident-ID fehlt");

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "RESOLVED") {
    data.resolvedAt = new Date();
  }

  const updated = await db.incident.update({
    where: { id: incidentId, appId: app.id },
    data,
  });
  const action = parsed.data.status === "RESOLVED" ? "incident.resolved" : "incident.updated";
  await logActivity({ appId: app.id, userId: session.user?.id, action, entityType: "incident", entityId: incidentId, metadata: { title: updated.title, status: updated.status } });
  return Response.json(updated);
}
