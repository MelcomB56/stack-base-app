import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { guard } from "@/lib/rbac";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const session = await auth();
  const err = await guard(session, "app_costs.update");
  if (err) return err;
  const { id } = await params;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.month !== undefined) data.month = body.month;
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.category !== undefined) data.category = body.category;
  if (body.note !== undefined) data.note = body.note || null;

  const cost = await db.appCost.update({ where: { id }, data });
  return NextResponse.json({ ...cost, amount: Number(cost.amount) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const session = await auth();
  const errD = await guard(session, "app_costs.delete");
  if (errD) return errD;
  const { id } = await params;

  await db.appCost.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
