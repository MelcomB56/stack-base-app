import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { updateChangelogEntrySchema } from "@/lib/validations/changelog";

type Params = { params: Promise<{ slug: string; id: string }> };

async function getEntryForApp(slug: string, id: string) {
  const app = await db.app.findUnique({ where: { slug, deletedAt: null } });
  if (!app) return { error: apiError("App nicht gefunden", 404) };

  const entry = await db.changelogEntry.findFirst({ where: { id, appId: app.id } });
  if (!entry) return { error: apiError("Changelog-Eintrag nicht gefunden", 404) };

  return { app, entry };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug, id } = await params;
  const { app, entry, error } = await getEntryForApp(slug, id);
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = updateChangelogEntrySchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  if (parsed.data.releaseId) {
    const release = await db.release.findFirst({
      where: { id: parsed.data.releaseId, appId: app!.id },
    });
    if (!release) return apiError("Release nicht gefunden", 404);
  }

  const { entryDate, ...rest } = parsed.data;

  const updated = await db.changelogEntry.update({
    where: { id: entry!.id },
    data: {
      ...rest,
      ...(entryDate !== undefined ? { entryDate: new Date(entryDate) } : {}),
    },
  });

  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { slug, id } = await params;
  const { entry, error } = await getEntryForApp(slug, id);
  if (error) return error;

  await db.changelogEntry.delete({ where: { id: entry!.id } });
  return new Response(null, { status: 204 });
}
