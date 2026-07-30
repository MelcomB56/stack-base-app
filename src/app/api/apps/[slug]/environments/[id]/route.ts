import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { z } from "zod/v4";

const PatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION", "CUSTOM"]).optional(),
  url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["ONLINE", "OFFLINE", "DEGRADED", "UNKNOWN", "MAINTENANCE"]).optional(),
  statusNote: z.string().max(255).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);
  const { id } = await params;

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const { name, type, url, status, statusNote, sortOrder } = parsed.data;
  const env = await db.appEnvironment.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(url !== undefined && { url: url || null }),
      ...(status !== undefined && { status }),
      ...(statusNote !== undefined && { statusNote: statusNote || null }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
  return NextResponse.json(env);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);
  const { id } = await params;
  await db.appEnvironment.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
