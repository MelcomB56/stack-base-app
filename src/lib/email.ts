import "server-only";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  // DB-Einstellungen haben Vorrang vor Env-Vars
  const rows = await db.systemSetting.findMany({
    where: { key: { in: ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure"] } },
  });
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const host = s["smtp_host"] || process.env.SMTP_HOST || "";
  if (!host) return null;

  const port = parseInt(s["smtp_port"] || process.env.SMTP_PORT || "587", 10);
  const secure = (s["smtp_secure"] || process.env.SMTP_SECURE || "") === "true" || port === 465;
  const user = s["smtp_user"] || process.env.SMTP_USER || "";
  const pass = s["smtp_pass"] || process.env.SMTP_PASS || "";
  const from = s["smtp_from"] || process.env.SMTP_FROM || "Stack-Base <noreply@stack-base.local>";

  return { host, port, secure, user, pass, from };
}

async function getTransporter() {
  const cfg = await getSmtpConfig();
  if (!cfg) return null;
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function send(to: string, subject: string, html: string) {
  try {
    const transport = await getTransporter();
    if (!transport) return;
    const cfg = await getSmtpConfig();
    await transport.sendMail({ from: cfg!.from, to, subject, html });
  } catch (err) {
    console.error("[email] Fehler beim Versand an", to, "–", err instanceof Error ? err.message : err);
  }
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#0B1220; font-family: system-ui,sans-serif; color:#EDF2F7; }
  .wrap { max-width:560px; margin:32px auto; background:#111C2D; border:1px solid #1E3050; border-radius:12px; overflow:hidden; }
  .header { background:#162035; padding:18px 24px; border-bottom:1px solid #1E3050; display:flex; align-items:center; gap:10px; }
  .header h1 { margin:0; font-size:15px; font-weight:700; color:#EDF2F7; }
  .body { padding:24px; }
  .label { font-size:11px; font-weight:600; color:#7A8BA6; text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }
  .value { font-size:14px; color:#EDF2F7; margin-bottom:16px; }
  .badge { display:inline-block; padding:2px 10px; border-radius:99px; font-size:11px; font-weight:700; }
  .btn { display:inline-block; margin-top:8px; padding:10px 20px; background:#2563E8; color:#EDF2F7; border-radius:8px; text-decoration:none; font-size:13px; font-weight:600; }
  .footer { padding:14px 24px; background:#0B1220; border-top:1px solid #1E3050; font-size:11px; color:#7A8BA6; }
</style></head><body>
<div class="wrap">
  <div class="header">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563E8" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
    <h1>Stack-Base</h1>
  </div>
  <div class="body">${content}</div>
  <div class="footer">Du erhältst diese E-Mail, weil du für diese App Benachrichtigungen aktiviert hast.</div>
</div>
</body></html>`;
}

const STATUS_COLORS: Record<string, string> = {
  PRODUCTION: "#10B981", DEVELOPMENT: "#3B82F6", TESTING: "#F59E0B",
  MAINTENANCE: "#F97316", ARCHIVED: "#6B7280",
};
const STATUS_LABELS: Record<string, string> = {
  PRODUCTION: "Produktion", DEVELOPMENT: "Entwicklung", TESTING: "Testing",
  MAINTENANCE: "Wartung", ARCHIVED: "Archiviert",
};

export async function sendStatusChangeEmail(opts: {
  to: string;
  appName: string;
  appSlug: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}) {
  const { to, appName, appSlug, oldStatus, newStatus, changedBy } = opts;
  const url = `${APP_URL}/apps/${appSlug}`;
  const newColor = STATUS_COLORS[newStatus] ?? "#7A8BA6";
  const newLabel = STATUS_LABELS[newStatus] ?? newStatus;
  const oldLabel = STATUS_LABELS[oldStatus] ?? oldStatus;

  const html = baseLayout(`
    <p style="margin:0 0 20px; font-size:15px; font-weight:600;">Status-Änderung: <em>${appName}</em></p>
    <div class="label">Neuer Status</div>
    <div class="value"><span class="badge" style="background:${newColor}22;color:${newColor};border:1px solid ${newColor}44">${newLabel}</span></div>
    <div class="label">Vorheriger Status</div>
    <div class="value" style="color:#7A8BA6">${oldLabel}</div>
    <div class="label">Geändert von</div>
    <div class="value">${changedBy}</div>
    <a href="${url}" class="btn">App öffnen →</a>
  `);

  await send(to, `[Stack-Base] ${appName} — Status geändert zu ${newLabel}`, html);
}

export async function sendIncidentEmail(opts: {
  to: string;
  appName: string;
  appSlug: string;
  title: string;
  severity: string;
  reportedBy: string;
}) {
  const { to, appName, appSlug, title, severity, reportedBy } = opts;
  const url = `${APP_URL}/apps/${appSlug}`;
  const sevColors: Record<string, string> = { CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#EAB308", LOW: "#10B981" };
  const sevColor = sevColors[severity] ?? "#7A8BA6";

  const html = baseLayout(`
    <p style="margin:0 0 20px; font-size:15px; font-weight:600;">Neues Incident: <em>${appName}</em></p>
    <div class="label">Titel</div>
    <div class="value">${title}</div>
    <div class="label">Schweregrad</div>
    <div class="value"><span class="badge" style="background:${sevColor}22;color:${sevColor};border:1px solid ${sevColor}44">${severity}</span></div>
    <div class="label">Gemeldet von</div>
    <div class="value">${reportedBy}</div>
    <a href="${url}" class="btn">Incident ansehen →</a>
  `);

  await send(to, `[Stack-Base] Incident bei ${appName}: ${title}`, html);
}

export async function sendReleaseEmail(opts: {
  to: string;
  appName: string;
  appSlug: string;
  version: string;
  releaseType: string;
}) {
  const { to, appName, appSlug, version, releaseType } = opts;
  const url = `${APP_URL}/apps/${appSlug}`;

  const html = baseLayout(`
    <p style="margin:0 0 20px; font-size:15px; font-weight:600;">Neues Release: <em>${appName}</em></p>
    <div class="label">Version</div>
    <div class="value" style="font-family:monospace;font-size:16px;font-weight:700;color:#2563E8">v${version}</div>
    <div class="label">Typ</div>
    <div class="value">${releaseType}</div>
    <a href="${url}" class="btn">Release ansehen →</a>
  `);

  await send(to, `[Stack-Base] Neues Release ${appName} v${version}`, html);
}
