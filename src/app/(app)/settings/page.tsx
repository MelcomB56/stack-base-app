import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Settings } from "lucide-react";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const smtpRows = await db.systemSetting.findMany({
    where: { key: { in: ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure"] } },
  });

  const smtp = Object.fromEntries(smtpRows.map((r) => [r.key, r.value]));
  if (smtp["smtp_pass"]) smtp["smtp_pass"] = "••••••••";

  const user = userId
    ? await db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, avatarUrl: true },
      })
    : null;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100 }}>

      {/* Seitenkopf */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Settings size={18} style={{ color: "#2563E8" }} />
          Einstellungen
        </h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", margin: "4px 0 0" }}>Systemkonfiguration und Integrationen</p>
      </div>

      <SettingsTabs smtpInitial={smtp} user={user} initials={initials} />

    </div>
  );
}
