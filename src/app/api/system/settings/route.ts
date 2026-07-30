import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/server-utils";

const ALLOWED_KEYS = [
  "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure",
];

export async function GET() {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);
  const rows = await db.systemSetting.findMany({ where: { key: { in: ALLOWED_KEYS } } });
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  // Passwort nie zurückgeben — nur ob gesetzt
  if (settings["smtp_pass"]) settings["smtp_pass"] = "••••••••";
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);
  const body = await req.json() as Record<string, string>;

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.includes(key)) continue;
    // Leerer Passwort-Wert = nicht überschreiben
    if (key === "smtp_pass" && value === "") continue;
    if (value === "") {
      await db.systemSetting.deleteMany({ where: { key } });
    } else {
      await db.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
