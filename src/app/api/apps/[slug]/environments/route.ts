import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { z } from "zod/v4";

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION", "CUSTOM"]).optional(),
  url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["ONLINE", "OFFLINE", "DEGRADED", "UNKNOWN", "MAINTENANCE"]).optional(),
  statusNote: z.string().max(255).optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const err = await guard(session, "app_environments.read");
  if (err) return err;
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);
  const environments = await db.appEnvironment.findMany({
    where: { appId: app.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(environments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const errP = await guard(session, "app_environments.create");
  if (errP) return errP;
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug }, select: { id: true } });
  if (!app) return apiError("App nicht gefunden", 404);

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const { name, type, url, status, statusNote, sortOrder } = parsed.data;

  const maxOrder = await db.appEnvironment.aggregate({
    where: { appId: app.id },
    _max: { sortOrder: true },
  });

  const env = await db.appEnvironment.create({
    data: {
      appId: app.id,
      name,
      type: type ?? "CUSTOM",
      url: url || null,
      status: status ?? "UNKNOWN",
      statusNote: statusNote || null,
      sortOrder: sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(env, { status: 201 });
}
