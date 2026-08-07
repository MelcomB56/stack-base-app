import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, slugify } from "@/lib/server-utils";
import { createTagSchema } from "@/lib/validations/tag";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  const err = await guard(session, "tags.read");
  if (err) return err;
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { apps: true } } },
  });
  return Response.json(tags);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const errP = await guard(session, "tags.create");
  if (errP) return errP;
  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const name = parsed.data.name.toLowerCase().trim();
  const slug = slugify(name);
  const exists = await db.tag.findUnique({ where: { slug } });
  if (exists) return apiError("Tag existiert bereits", 409);

  const tag = await db.tag.create({ data: { ...parsed.data, name, slug } });
  return Response.json(tag, { status: 201 });
}
