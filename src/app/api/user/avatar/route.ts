import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { uploadFile, deleteFile, objectNameFromUrl } from "@/lib/storage";
import { apiError } from "@/lib/server-utils";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return apiError("Nicht authentifiziert", 401);

  const formData = await req.formData().catch(() => null);
  if (!formData) return apiError("Ungültige Formulardaten");

  const file = formData.get("avatar") as File | null;
  if (!file) return apiError("Keine Datei übermittelt");
  if (!ALLOWED.includes(file.type)) return apiError("Nur PNG, JPG, WebP oder GIF erlaubt");
  if (file.size > MAX_BYTES) return apiError("Datei darf maximal 5 MB groß sein");

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const objectName = `avatars/${userId}.${ext}`;

  // Altes Bild aus MinIO entfernen (falls anderer Typ)
  const user = await db.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
  if (user?.avatarUrl) {
    const old = objectNameFromUrl(user.avatarUrl);
    if (old !== objectName) await deleteFile(old);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadFile(objectName, buffer, file.type);

  await db.user.update({ where: { id: userId }, data: { avatarUrl: url } });

  return Response.json({ avatarUrl: url });
}

export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return apiError("Nicht authentifiziert", 401);

  const user = await db.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
  if (user?.avatarUrl) {
    await deleteFile(objectNameFromUrl(user.avatarUrl));
    await db.user.update({ where: { id: userId }, data: { avatarUrl: null } });
  }

  return new Response(null, { status: 204 });
}
