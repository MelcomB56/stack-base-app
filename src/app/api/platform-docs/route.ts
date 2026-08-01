import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AGENT_GUIDE } from "@/lib/agent-guide";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let docs = await db.docPage.findMany({
    where: { appId: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { createdBy: { select: { name: true } } },
  });

  if (docs.length === 0) {
    const created = await db.docPage.create({
      data: {
        appId: null,
        title: "Stack-Base Agent einrichten",
        slug: "stackbase-agent-einrichten",
        content: AGENT_GUIDE,
        type: "MANUAL",
        isPublic: false,
        sortOrder: 0,
        createdById: session.user!.id!,
      },
      include: { createdBy: { select: { name: true } } },
    });
    docs = [created];
  }

  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, content, type, isPublic } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Titel fehlt" }, { status: 400 });

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 200) || "dokument";

  const doc = await db.docPage.create({
    data: {
      appId: null,
      title: title.trim(),
      slug,
      content: content ?? "",
      type: type ?? "MANUAL",
      isPublic: isPublic ?? false,
      sortOrder: 0,
      createdById: session.user!.id!,
    },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(doc);
}
