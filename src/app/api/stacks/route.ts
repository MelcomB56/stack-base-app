import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, slugify } from "@/lib/server-utils";
import { createStackSchema } from "@/lib/validations/stack";

export async function GET() {
  const stacks = await db.stack.findMany({
    orderBy: { name: "asc" },
    include: {
      technologies: { include: { technology: true } },
      _count: { select: { apps: true } },
    },
  });
  return Response.json(stacks);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = createStackSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const { technologyIds, ...data } = parsed.data;
  const slug = slugify(data.name);
  const exists = await db.stack.findUnique({ where: { slug } });
  if (exists) return apiError("Stack existiert bereits", 409);

  const stack = await db.stack.create({
    data: {
      ...data,
      slug,
      technologies: {
        create: technologyIds.map((id) => ({ technologyId: id })),
      },
    },
    include: { technologies: { include: { technology: true } } },
  });
  return Response.json(stack, { status: 201 });
}
