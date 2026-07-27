import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { createReleaseSchema } from "@/lib/validations/release";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null } });
  if (!app) return apiError("App nicht gefunden", 404);

  const releases = await db.release.findMany({
    where: { appId: app.id },
    orderBy: { releasedAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { changelogEntries: true } },
    },
  });

  return Response.json(releases);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const app = await db.app.findUnique({ where: { slug, deletedAt: null } });
  if (!app) return apiError("App nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = createReleaseSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const firstUser = await db.user.findFirst();
  if (!firstUser) return apiError("Kein User gefunden", 500);

  const exists = await db.release.findUnique({
    where: { appId_version: { appId: app.id, version: parsed.data.version } },
  });
  if (exists) return apiError(`Version ${parsed.data.version} existiert bereits`, 409);

  const { isCurrent, ...rest } = parsed.data;

  const release = await db.$transaction(async (tx) => {
    if (isCurrent) {
      await tx.release.updateMany({
        where: { appId: app.id },
        data: { isCurrent: false },
      });
    }
    return tx.release.create({
      data: {
        ...rest,
        releasedAt: new Date(rest.releasedAt),
        isCurrent: isCurrent ?? false,
        appId: app.id,
        createdById: firstUser.id,
      },
    });
  });

  return Response.json(release, { status: 201 });
}
