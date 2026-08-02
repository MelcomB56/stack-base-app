import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Settings, User, Shield, Bell, Mail, Cpu } from "lucide-react";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { WorkerStatusCard } from "@/components/settings/WorkerStatusCard";
import { SmtpSettingsForm } from "@/components/settings/SmtpSettingsForm";

// ─── Layout-Helfer ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, description }: { icon: React.ReactNode; label: string; description?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, paddingBottom: 14, borderBottom: "1px solid #1E3050" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#7A8BA6" }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A8BA6" }}>
          {label}
        </span>
      </div>
      {description && (
        <span style={{ fontSize: 12, color: "#4A5B6F", marginLeft: 4 }}>{description}</span>
      )}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#111C2D",
      border: "1px solid #1E3050",
      borderRadius: 12,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
      {icon}
      {children}
    </p>
  );
}

// ─── Seite ────────────────────────────────────────────────────────────────────

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [user, smtpRows] = await Promise.all([
    userId
      ? db.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
        })
      : null,
    db.systemSetting.findMany({
      where: { key: { in: ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure"] } },
    }),
  ]);

  const smtp = Object.fromEntries(smtpRows.map((r) => [r.key, r.value]));
  if (smtp["smtp_pass"]) smtp["smtp_pass"] = "••••••••";

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  function fmt(d: Date | null | undefined) {
    if (!d) return "—";
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(d);
  }

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 32, maxWidth: 1100 }}>

      {/* Seitenkopf */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Settings size={18} style={{ color: "#2563E8" }} />
          Einstellungen
        </h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4, margin: "4px 0 0" }}>Profil, Sicherheit und Systemkonfiguration</p>
      </div>

      {/* ── Sektion: Konto ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionHeader icon={<User size={13} />} label="Konto" description="Persönliche Daten und Zugangssicherheit" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

          {/* Profil-Karte */}
          <Card>
            <CardLabel icon={<User size={11} />}>Profil</CardLabel>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(37,99,232,0.15)", border: "2px solid rgba(37,99,232,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#2563E8" }}>{initials}</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>{user?.name ?? "—"}</p>
                <p style={{ fontSize: 12, color: "#7A8BA6", margin: "2px 0 0" }}>{user?.email ?? "—"}</p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #1E3050", paddingTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Rolle",          value: user?.role ?? "—" },
                { label: "Mitglied seit",  value: fmt(user?.createdAt) },
                { label: "Letzter Login",  value: fmt(user?.lastLoginAt) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 10, color: "#7A8BA6", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #1E3050", paddingTop: 14 }}>
              <ProfileForm initialName={user?.name ?? ""} initialEmail={user?.email ?? ""} />
            </div>
          </Card>

          {/* Sicherheit-Karte */}
          <Card>
            <CardLabel icon={<Shield size={11} />}>Sicherheit</CardLabel>
            <PasswordChangeForm />
          </Card>

        </div>
      </div>

      {/* ── Sektion: System ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionHeader icon={<Cpu size={13} />} label="System" description="Infrastruktur und Integrationen" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

          {/* SMTP-Karte */}
          <Card>
            <div>
              <CardLabel icon={<Mail size={11} />}>E-Mail / SMTP</CardLabel>
              <p style={{ fontSize: 12, color: "#7A8BA6", margin: "8px 0 0", lineHeight: 1.5 }}>
                Globale SMTP-Konfiguration für alle App-Benachrichtigungen. Überschreibt Werte aus{" "}
                <code style={{ fontFamily: "monospace", fontSize: 11, background: "#1A2640", padding: "1px 6px", borderRadius: 4 }}>.env</code>.
              </p>
            </div>
            <SmtpSettingsForm initial={smtp} />
          </Card>

          {/* Worker-Status-Karte */}
          <WorkerStatusCard />

        </div>
      </div>

      {/* ── Sektion: Benachrichtigungen ─────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionHeader icon={<Bell size={13} />} label="Benachrichtigungen" />

        <Card style={{ maxWidth: 540 }}>
          <CardLabel icon={<Bell size={11} />}>Kanäle</CardLabel>
          <p style={{ fontSize: 13, color: "#7A8BA6", margin: 0, lineHeight: 1.6 }}>
            E-Mail-Empfänger werden pro App unter <em>App → Benachrichtigungen</em> verwaltet.
            Webhook-Benachrichtigungen folgen in einer späteren Version.
          </p>
        </Card>
      </div>

    </div>
  );
}
