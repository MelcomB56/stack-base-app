import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { uploadFile, deleteFile, objectNameFromUrl } from "@/lib/storage";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true, logoUrl: true } });
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
    return NextResponse.json({ error: "Nur Bilder erlaubt (PNG, JPG, SVG, WebP, ICO)" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Datei zu groß (max. 2 MB)" }, { status: 400 });
  }

  // Altes Logo löschen falls es ein MinIO-Upload war
  if (app.logoUrl) {
    try {
      const old = objectNameFromUrl(app.logoUrl);
      if (old.startsWith("logos/")) await deleteFile(old);
    } catch { /* ignore */ }
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const objectName = `logos/${app.id}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const logoUrl = await uploadFile(objectName, buffer, file.type);

  await db.app.update({ where: { id: app.id }, data: { logoUrl } });

  return NextResponse.json({ logoUrl });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null }, select: { id: true, logoUrl: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (app.logoUrl) {
    try {
      const objectName = objectNameFromUrl(app.logoUrl);
      if (objectName.startsWith("logos/")) await deleteFile(objectName);
    } catch { /* ignore */ }
  }

  await db.app.update({ where: { id: app.id }, data: { logoUrl: null } });
  return NextResponse.json({ ok: true });
}
