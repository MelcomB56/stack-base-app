import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { updateReleaseSchema } from "@/lib/validations/release";

type Params = { params: Promise<{ slug: string; id: string }> };

async function getReleaseForApp(slug: string, id: string) {
  const app = await db.app.findUnique({ where: { slug, deletedAt: null } });
  if (!app) return { error: apiError("App nicht gefunden", 404) };

  const release = await db.release.findFirst({ where: { id, appId: app.id } });
  if (!release) return { error: apiError("Release nicht gefunden", 404) };

  return { app, release };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug, id } = await params;
  const { app, release, error } = await getReleaseForApp(slug, id);
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = updateReleaseSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const { isCurrent, releasedAt, ...rest } = parsed.data;

  const updated = await db.$transaction(async (tx) => {
    if (isCurrent === true) {
      await tx.release.updateMany({
        where: { appId: app!.id, id: { not: release!.id } },
        data: { isCurrent: false },
      });
    }
    return tx.release.update({
      where: { id: release!.id },
      data: {
        ...rest,
        ...(releasedAt !== undefined ? { releasedAt: new Date(releasedAt) } : {}),
        ...(isCurrent !== undefined ? { isCurrent } : {}),
      },
    });
  });

  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { slug, id } = await params;
  const { release, error } = await getReleaseForApp(slug, id);
  if (error) return error;

  await db.release.delete({ where: { id: release!.id } });
  return new Response(null, { status: 204 });
}
