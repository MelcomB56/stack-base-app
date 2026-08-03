import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { apiError } from "@/lib/server-utils";
import { z } from "zod";

const createSchema = z.object({
  title:    z.string().min(1).max(200),
  content:  z.string().min(1),
  pinned:   z.boolean().default(false),
  audience: z.string().max(50).default("all"),
});

export async function GET() {
  const announcements = await db.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
  return Response.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Nicht authentifiziert", 401);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Ungültiger Body");

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const a = await db.announcement.create({ data: parsed.data });
  return Response.json(a, { status: 201 });
}
