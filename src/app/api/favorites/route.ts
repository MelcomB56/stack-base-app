import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { auth } from "@/auth";
import { z } from "zod";

const toggleSchema = z.object({ appId: z.string().uuid() });

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return apiError("Nicht authentifiziert", 401);

  const favorites = await db.userFavorite.findMany({
    where: { userId },
    include: {
      app: {
        include: {
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(favorites.map((f) => f.app));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return apiError("Nicht authentifiziert", 401);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const app = await db.app.findUnique({ where: { id: parsed.data.appId, deletedAt: null } });
  if (!app) return apiError("App nicht gefunden", 404);

  const existing = await db.userFavorite.findUnique({
    where: { userId_appId: { userId, appId: app.id } },
  });
  if (existing) return apiError("Bereits als Favorit gespeichert", 409);

  await db.userFavorite.create({ data: { userId, appId: app.id } });
  return Response.json({ favorited: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return apiError("Nicht authentifiziert", 401);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const existing = await db.userFavorite.findUnique({
    where: { userId_appId: { userId, appId: parsed.data.appId } },
  });
  if (!existing) return apiError("Favorit nicht gefunden", 404);

  await db.userFavorite.delete({
    where: { userId_appId: { userId, appId: parsed.data.appId } },
  });
  return new Response(null, { status: 204 });
}
