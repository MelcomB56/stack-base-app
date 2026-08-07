import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiError } from "@/lib/server-utils";
import { guard } from "@/lib/rbac";
import { getSmtpConfig } from "@/lib/email";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const session = await auth();
  const err = await guard(session, "settings.update");
  if (err) return err;

  const cfg = await getSmtpConfig();
  if (!cfg) return NextResponse.json({ ok: false, error: "SMTP nicht konfiguriert" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const sendTest = body?.sendTest === true;
  const testTo   = body?.to as string | undefined;

  try {
    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
    });

    await transport.verify();

    if (sendTest && testTo) {
      await transport.sendMail({
        from: cfg.from,
        to: testTo,
        subject: "[Stack-Base] SMTP-Test",
        html: `<p style="font-family:sans-serif">SMTP-Verbindung funktioniert.<br>Von: <code>${cfg.from}</code></p>`,
      });
      return NextResponse.json({ ok: true, message: `Test-Mail von ${cfg.from} an ${testTo} gesendet` });
    }

    return NextResponse.json({ ok: true, message: `Verbindung zu ${cfg.host}:${cfg.port} erfolgreich` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
