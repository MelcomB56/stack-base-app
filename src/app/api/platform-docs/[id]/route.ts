import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const err = await guard(session, "platform_docs.update");
  if (err) return err;

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
  const errD = await guard(session, "platform_docs.delete");
  if (errD) return errD;

  const { id } = await params;
  await db.docPage.delete({ where: { id, appId: null } });
  return NextResponse.json({ ok: true });
}
