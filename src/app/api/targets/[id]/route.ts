import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";

const schema = z.object({
  name:     z.string().min(1).max(100).optional(),
  type:     z.enum(["SERVER", "CLOUD", "KUBERNETES", "PAAS", "OTHER"]).optional(),
  host:     z.string().max(255).optional(),
  provider: z.string().max(100).optional(),
  region:   z.string().max(100).optional(),
  notes:    z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  try {
    const target = await db.deploymentTarget.update({
      where: { id },
      data: {
        ...(data.name     !== undefined && { name:     data.name }),
        ...(data.type     !== undefined && { type:     data.type }),
        ...(data.host     !== undefined && { host:     data.host     || null }),
        ...(data.provider !== undefined && { provider: data.provider || null }),
        ...(data.region   !== undefined && { region:   data.region   || null }),
        ...(data.notes    !== undefined && { notes:    data.notes    || null }),
      },
    });
    return NextResponse.json(target);
  } catch {
    return NextResponse.json({ error: "Name bereits vergeben oder Target nicht gefunden" }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.deploymentTarget.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
