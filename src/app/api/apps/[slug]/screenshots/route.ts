import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { uploadFile } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const screenshots = await db.screenshot.findMany({
    where: { appId: app.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(screenshots);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Ungültiges Formular" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Keine Datei" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Nur Bilder erlaubt (JPEG, PNG, WebP, GIF)" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Datei zu groß (max. 10 MB)" }, { status: 400 });
  }

  const title = (formData.get("title") as string | null) || null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const objectName = `screenshots/${app.id}/${randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileUrl = await uploadFile(objectName, buffer, file.type);

  const maxOrder = await db.screenshot.aggregate({ where: { appId: app.id }, _max: { sortOrder: true } });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const screenshot = await db.screenshot.create({
    data: {
      appId: app.id,
      title,
      fileUrl,
      fileSize: file.size,
      sortOrder,
      uploadedById: session.user.id,
    },
  });

  await logActivity({ appId: app.id, userId: session.user.id, action: "screenshot.uploaded", entityType: "screenshot", entityId: screenshot.id, metadata: { title: title ?? file.name } });

  return NextResponse.json(screenshot, { status: 201 });
}
