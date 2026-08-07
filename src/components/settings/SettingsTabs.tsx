"use client";

import { useState } from "react";
import { Mail, Shield, Bell } from "lucide-react";
import { SmtpSettingsForm } from "@/components/settings/SmtpSettingsForm";
import { WorkerStatusCard } from "@/components/settings/WorkerStatusCard";
import { SsoSettingsForm } from "@/components/settings/SsoSettingsForm";
import { ProfileLink } from "@/components/settings/ProfileLink";

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "system", label: "System" },
  { id: "infra",  label: "Infrastruktur und Integrationen" },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  smtpInitial: Record<string, string>;
  user: { name: string; email: string; avatarUrl: string | null } | null;
  initials: string;
}

// ─── Shared card style ────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "#111C2D",
  border: "1px solid #1E3050",
  borderRadius: 12,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{ color: "#7A8BA6", display: "flex" }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A8BA6" }}>
        {children}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsTabs({ smtpInitial, user, initials }: Props) {
  const [tab, setTab] = useState<TabId>("system");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Profil-Karte ──────────────────────────────────────────────────── */}
      <ProfileLink
        name={user?.name ?? "—"}
        email={user?.email ?? "—"}
        avatarUrl={user?.avatarUrl ?? null}
        initials={initials}
      />

      {/* ── Tab-Bar ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", borderBottom: "1px solid #1E3050", gap: 4 }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 14px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${active ? "#2563E8" : "transparent"}`,
                color: active ? "#EDF2F7" : "#7A8BA6",
                fontSize: t.id === "system" ? 12 : 13,
                fontWeight: active ? 700 : 500,
                letterSpacing: t.id === "system" ? ".12em" : "0",
                textTransform: t.id === "system" ? "uppercase" : "none",
                cursor: "pointer",
                marginBottom: -1,
                transition: "color 150ms, border-color 150ms",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#A0B4C8"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#7A8BA6"; }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab-Inhalt: System ────────────────────────────────────────────── */}
      {tab === "system" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

          {/* SMTP-Karte */}
          <div style={card}>
            <div>
              <SectionLabel icon={<Mail size={11} />}>E-Mail / SMTP</SectionLabel>
              <p style={{ fontSize: 12, color: "#7A8BA6", margin: "8px 0 0", lineHeight: 1.5 }}>
                Globale SMTP-Konfiguration für alle App-Benachrichtigungen. Überschreibt Werte aus{" "}
                <code style={{ fontFamily: "monospace", fontSize: 11, background: "#1A2640", padding: "1px 6px", borderRadius: 4 }}>.env</code>.
              </p>
            </div>
            <SmtpSettingsForm initial={smtpInitial} />
          </div>

          {/* Worker-Karte */}
          <WorkerStatusCard />
        </div>
      )}

      {/* ── Tab-Inhalt: Infrastruktur ─────────────────────────────────────── */}
      {tab === "infra" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* SSO-Karte */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, paddingBottom: 14, borderBottom: "1px solid #1E3050" }}>
              <SectionLabel icon={<Shield size={11} />}>SSO / Authentik</SectionLabel>
              <span style={{ fontSize: 12, color: "#4A5B6F" }}>Single Sign-On mit Authentik als Identity Provider</span>
            </div>
            <SsoSettingsForm />
          </div>

          {/* Benachrichtigungen */}
          <div style={{ ...card, maxWidth: 560 }}>
            <SectionLabel icon={<Bell size={11} />}>Benachrichtigungen</SectionLabel>
            <p style={{ fontSize: 13, color: "#7A8BA6", margin: 0, lineHeight: 1.6 }}>
              E-Mail-Empfänger werden pro App unter <em>App → Benachrichtigungen</em> verwaltet.
              Webhook-Benachrichtigungen folgen in einer späteren Version.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
