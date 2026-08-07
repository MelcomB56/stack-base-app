import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, slugify } from "@/lib/server-utils";
import { createTechnologySchema } from "@/lib/validations/stack";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  const err = await guard(session, "technologies.read");
  if (err) return err;
  const technologies = await db.technology.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { _count: { select: { apps: true } } },
  });
  return Response.json(technologies);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const errP = await guard(session, "technologies.create");
  if (errP) return errP;
  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = createTechnologySchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const slug = slugify(parsed.data.name);
  const exists = await db.technology.findUnique({ where: { slug } });
  if (exists) return apiError("Technologie existiert bereits", 409);

  const { logoUrl, websiteUrl, ...rest } = parsed.data;
  const technology = await db.technology.create({
    data: {
      ...rest,
      slug,
      ...(logoUrl ? { logoUrl } : {}),
      ...(websiteUrl ? { websiteUrl } : {}),
    },
  });
  return Response.json(technology, { status: 201 });
}
