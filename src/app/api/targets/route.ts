import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";

const schema = z.object({
  name:     z.string().min(1).max(100),
  type:     z.enum(["SERVER", "CLOUD", "KUBERNETES", "PAAS", "OTHER"]).default("SERVER"),
  status:   z.enum(["ACTIVE", "MAINTENANCE", "OFFLINE"]).default("ACTIVE"),
  host:     z.string().max(255).optional(),
  provider: z.string().max(100).optional(),
  region:   z.string().max(100).optional(),
  notes:    z.string().max(500).optional(),
});

export async function GET() {
  const targets = await db.deploymentTarget.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { apps: true } } },
  });
  return NextResponse.json(targets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, type, status, host, provider, region, notes } = parsed.data;
  try {
    const target = await db.deploymentTarget.create({
      data: {
        name,
        type,
        status,
        host:     host     || null,
        provider: provider || null,
        region:   region   || null,
        notes:    notes    || null,
      },
    });
    return NextResponse.json(target, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Name bereits vergeben" }, { status: 409 });
  }
}
