import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiError } from "@/lib/server-utils";
import { getSmtpConfig } from "@/lib/email";
import nodemailer from "nodemailer";

export async function POST() {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  const cfg = await getSmtpConfig();
  if (!cfg) return NextResponse.json({ ok: false, error: "SMTP nicht konfiguriert" }, { status: 400 });

  try {
    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
    });
    await transport.verify();
    return NextResponse.json({ ok: true, message: `Verbindung zu ${cfg.host}:${cfg.port} erfolgreich` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
