import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, content, type, isPublic } = body;

  const doc = await db.docPage.update({
    where: { id, appId: null },
    data: {
      title: title?.trim(),
      content: content ?? "",
      type: type ?? "MANUAL",
      isPublic: isPublic ?? false,
    },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(doc);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.docPage.delete({ where: { id, appId: null } });
  return NextResponse.json({ ok: true });
}
