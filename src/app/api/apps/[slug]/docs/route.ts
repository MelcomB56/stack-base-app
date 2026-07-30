import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const docs = await db.docPage.findMany({
    where: { appId: app.id, parentId: null },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(docs);
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  content: z.string().default(""),
  type: z.enum(["MANUAL", "FAQ", "API", "OTHER"]).default("MANUAL"),
  isPublic: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  parentId: z.string().nullable().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = createSchema.parse(await req.json());
  const docSlug =
    body.slug ??
    body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const doc = await db.docPage.create({
    data: {
      appId: app.id,
      title: body.title,
      slug: docSlug,
      content: body.content,
      type: body.type,
      isPublic: body.isPublic,
      sortOrder: body.sortOrder,
      parentId: body.parentId ?? null,
      createdById: session.user.id,
    },
    include: { createdBy: { select: { name: true } } },
  });

  await logActivity({ appId: app.id, userId: session.user.id, action: "doc.created", entityType: "doc", entityId: doc.id, metadata: { title: doc.title, type: doc.type } });
  return NextResponse.json(doc, { status: 201 });
}
