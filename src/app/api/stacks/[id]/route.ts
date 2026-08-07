import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, slugify } from "@/lib/server-utils";
import { updateStackSchema } from "@/lib/validations/stack";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  const err = await guard(session, "stacks.update");
  if (err) return err;
  const { id } = await params;
  const stack = await db.stack.findUnique({ where: { id } });
  if (!stack) return apiError("Stack nicht gefunden", 404);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = updateStackSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const { technologyIds, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (rest.name && rest.name !== stack.name) {
    data.slug = slugify(rest.name);
  }

  const updated = await db.$transaction(async (tx) => {
    if (technologyIds !== undefined) {
      await tx.stackTechnology.deleteMany({ where: { stackId: id } });
      if (technologyIds.length > 0) {
        await tx.stackTechnology.createMany({
          data: technologyIds.map((technologyId) => ({ stackId: id, technologyId })),
        });
      }
    }
    return tx.stack.update({
      where: { id },
      data,
      include: { technologies: { include: { technology: true } } },
    });
  });

  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const errD = await guard(session, "stacks.delete");
  if (errD) return errD;
  const { id } = await params;
  const count = await db.appStack.count({ where: { stackId: id } });
  if (count > 0)
    return apiError(`Stack wird von ${count} App(s) verwendet`, 409);

  await db.stack.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
