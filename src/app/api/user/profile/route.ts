import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";
import { auth } from "@/auth";
import { z } from "zod";

const profileSchema = z.object({
  name:  z.string().min(2).max(100),
  email: z.string().email().max(200),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return apiError("Nicht authentifiziert", 401);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Request-Body");

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const { name, email } = parsed.data;

  // E-Mail-Eindeutigkeit prüfen (falls geändert)
  if (email !== session.user?.email) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return apiError("E-Mail wird bereits verwendet", 409);
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { name, email },
    select: { id: true, name: true, email: true },
  });

  return Response.json(updated);
}
