import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Settings, User, Shield, Bell } from "lucide-react";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const user = userId
    ? await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
      })
    : null;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  function fmt(d: Date | null | undefined) {
    if (!d) return "—";
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(d);
  }

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Settings size={18} style={{ color: "#2563E8" }} />
          Einstellungen
        </h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>Profil und Systemkonfiguration</p>
      </div>

      {/* Profil */}
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <User size={11} />
          Profil
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(37,99,232,0.15)", border: "2px solid rgba(37,99,232,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#2563E8" }}>{initials}</span>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>{user?.name ?? "—"}</p>
            <p style={{ fontSize: 12, color: "#7A8BA6", margin: "2px 0 0" }}>{user?.email ?? "—"}</p>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #1E3050", paddingTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: "Rolle", value: user?.role ?? "—" },
            { label: "Mitglied seit", value: fmt(user?.createdAt) },
            { label: "Letzter Login", value: fmt(user?.lastLoginAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: 10, color: "#7A8BA6", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sicherheit */}
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <Shield size={11} />
          Sicherheit — Passwort ändern
        </p>
        <PasswordChangeForm />
      </div>

      {/* Benachrichtigungen */}
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <Bell size={11} />
          Benachrichtigungen
        </p>
        <p style={{ fontSize: 13, color: "#7A8BA6", margin: 0, lineHeight: 1.5 }}>
          Webhook- und E-Mail-Benachrichtigungen folgen in einer späteren Version.
        </p>
      </div>
    </div>
  );
}
