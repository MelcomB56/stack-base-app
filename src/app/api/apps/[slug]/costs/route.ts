import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const err = await guard(session, "app_costs.read");
  if (err) return err;
  const { slug } = await params;

  const app = await db.app.findUnique({ where: { slug }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const costs = await db.appCost.findMany({
    where: { appId: app.id },
    orderBy: [{ month: "desc" }, { category: "asc" }],
  });

  return NextResponse.json(costs.map((c) => ({ ...c, amount: Number(c.amount) })));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const errP = await guard(session, "app_costs.create");
  if (errP) return errP;
  const { slug } = await params;

  const app = await db.app.findUnique({ where: { slug }, select: { id: true } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { month, amount, category, note } = body;

  if (!month || !amount || !category) {
    return NextResponse.json({ error: "month, amount und category sind Pflicht" }, { status: 400 });
  }

  const cost = await db.appCost.create({
    data: { appId: app.id, month, amount, category, note: note || null },
  });

  return NextResponse.json({ ...cost, amount: Number(cost.amount) }, { status: 201 });
}
