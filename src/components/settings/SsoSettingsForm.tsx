"use client";

import { useState, useEffect, useRef } from "react";
import {
  Eye, EyeOff, Check, X, Loader2,
  ExternalLink, RefreshCw, Info, Copy,
} from "lucide-react";

const ROLE_OPTIONS = [
  { value: "GUEST",     label: "Gast" },
  { value: "CUSTOMER",  label: "Kunde" },
  { value: "TESTER",    label: "Tester" },
  { value: "DEVELOPER", label: "Entwickler" },
  { value: "ADMIN",     label: "Admin" },
];

interface SsoState {
  authentik_enabled: boolean;
  authentik_issuer: string;
  authentik_client_id: string;
  authentik_client_secret: string;
  authentik_label: string;
  authentik_default_role: string;
}

const DEFAULT: SsoState = {
  authentik_enabled: false,
  authentik_issuer: "",
  authentik_client_id: "",
  authentik_client_secret: "",
  authentik_label: "Mit Authentik anmelden",
  authentik_default_role: "GUEST",
};

const inputStyle: React.CSSProperties = {
  background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#EDF2F7", outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 150ms",
};

function CopyUrlRow({ label, url, note }: { label: string; url: string; note?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".09em" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8, overflow: "hidden" }}>
        <span style={{
          flex: 1, fontFamily: "monospace", fontSize: 12, color: "#93C5FD",
          padding: "8px 12px", overflowX: "auto", whiteSpace: "nowrap",
          scrollbarWidth: "none",
        }}>
          {url}
        </span>
        <button
          type="button"
          onClick={copy}
          title="Kopieren"
          style={{
            display: "flex", alignItems: "center", gap: 5, padding: "8px 12px",
            background: copied ? "rgba(52,211,153,0.12)" : "rgba(37,99,232,0.1)",
            border: "none", borderLeft: "1px solid #1E3050",
            cursor: "pointer", color: copied ? "#34D399" : "#5B87C5",
            fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
            transition: "background 150ms, color 150ms",
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Kopiert" : "Kopieren"}
        </button>
      </div>
      {note && <p style={{ margin: 0, fontSize: 11, color: "#4A5B6F", lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

function UrlReferenceBox() {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://stack-base.de";

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 14,
      padding: "14px 16px", borderRadius: 8,
      background: "rgba(37,99,232,0.06)", border: "1px solid rgba(37,99,232,0.18)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Info size={13} style={{ color: "#2563E8", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
          URLs für Authentik-Konfiguration
        </span>
      </div>
      <CopyUrlRow
        label='Redirect URI — Typ "Authorization"'
        url={`${origin}/api/auth/callback/authentik`}
        note="Login-Callback — in Authentik unter Redirect URIs/Origins (RegEx) mit Typ Authorization eintragen."
      />
      <CopyUrlRow
        label='Redirect URI — Typ "Post Logout"'
        url={`${origin}/login`}
        note="Weiterleitung nach Abmeldung — gleiche Feld-Gruppe, Typ Post Logout."
      />
    </div>
  );
}

export function SsoSettingsForm() {
  const [state, setState] = useState<SsoState>(DEFAULT);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const secretRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings/sso")
      .then((r) => r.json())
      .then((d) => {
        setState({
          authentik_enabled: d.authentik_enabled === "true",
          authentik_issuer: d.authentik_issuer ?? "",
          authentik_client_id: d.authentik_client_id ?? "",
          authentik_client_secret: d.authentik_client_secret ?? "",
          authentik_label: d.authentik_label ?? DEFAULT.authentik_label,
          authentik_default_role: d.authentik_default_role ?? DEFAULT.authentik_default_role,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function patch<K extends keyof SsoState>(key: K, value: SsoState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setDirty(true);
    setMsg(null);
    setTestResult(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, string> = {
        authentik_enabled: state.authentik_enabled ? "true" : "false",
        authentik_issuer: state.authentik_issuer,
        authentik_client_id: state.authentik_client_id,
        authentik_label: state.authentik_label,
        authentik_default_role: state.authentik_default_role,
      };
      // Secret nur schicken wenn kein Platzhalter
      if (state.authentik_client_secret && !/^[•]+$/.test(state.authentik_client_secret)) {
        body.authentik_client_secret = state.authentik_client_secret;
      }
      const res = await fetch("/api/settings/sso", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMsg({ ok: true, text: "Gespeichert — Änderungen werden innerhalb von 60 Sekunden aktiv." });
        setDirty(false);
      } else {
        const d = await res.json().catch(() => ({}));
        setMsg({ ok: false, text: d.error ?? "Fehler beim Speichern" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    if (!state.authentik_issuer) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/sso/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issuer: state.authentik_issuer }),
      });
      const d = await res.json();
      setTestResult({
        ok: d.ok,
        text: d.ok
          ? `Verbindung erfolgreich · ${d.issuer}`
          : `Verbindung fehlgeschlagen: ${d.error}`,
      });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7A8BA6", fontSize: 13, padding: "12px 0" }}>
        <Loader2 size={14} className="animate-spin" /> Lade SSO-Konfiguration…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Aktiviert-Toggle */}
      <div
        role="checkbox"
        aria-checked={state.authentik_enabled}
        tabIndex={0}
        onClick={() => patch("authentik_enabled", !state.authentik_enabled)}
        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") patch("authentik_enabled", !state.authentik_enabled); }}
        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}
      >
        <div style={{
          width: 36, height: 20, borderRadius: 10, flexShrink: 0,
          background: state.authentik_enabled ? "#2563E8" : "#1E3050",
          position: "relative", transition: "background 200ms",
        }}>
          <div style={{
            position: "absolute", top: 3, left: state.authentik_enabled ? 19 : 3,
            width: 14, height: 14, borderRadius: "50%",
            background: state.authentik_enabled ? "#fff" : "#7A8BA6",
            transition: "left 200ms",
          }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>SSO aktiviert</p>
          <p style={{ margin: 0, fontSize: 11, color: "#7A8BA6" }}>
            Zeigt den Authentik-Login-Button auf der Anmeldeseite
          </p>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #1A2640" }} />

      {/* Felder */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Issuer URL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
            Issuer URL *
          </label>
          <input
            style={inputStyle}
            value={state.authentik_issuer}
            onChange={(e) => patch("authentik_issuer", e.target.value)}
            placeholder="https://auth.example.com/application/o/stack-base/"
            onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }}
          />
          {state.authentik_issuer && (
            <button
              type="button"
              onClick={testConnection}
              disabled={testing}
              style={{
                alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 5,
                background: "none", border: "none", cursor: testing ? "not-allowed" : "pointer",
                fontSize: 11, color: testing ? "#4A5B6F" : "#5B87C5", padding: 0,
              }}
            >
              {testing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Verbindung testen
            </button>
          )}
          {testResult && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: testResult.ok ? "#34D399" : "#F87171" }}>
              {testResult.ok ? <Check size={11} style={{ marginTop: 1, flexShrink: 0 }} /> : <X size={11} style={{ marginTop: 1, flexShrink: 0 }} />}
              {testResult.text}
            </div>
          )}
        </div>

        {/* Anmelde-Label */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
            Button-Beschriftung
          </label>
          <input
            style={inputStyle}
            value={state.authentik_label}
            onChange={(e) => patch("authentik_label", e.target.value)}
            placeholder="Mit Authentik anmelden"
            maxLength={80}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }}
          />
          <p style={{ margin: 0, fontSize: 11, color: "#4A5B6F" }}>Erscheint auf der Anmeldeseite</p>
        </div>

        {/* Client ID */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
            Client ID *
          </label>
          <input
            style={inputStyle}
            value={state.authentik_client_id}
            onChange={(e) => patch("authentik_client_id", e.target.value)}
            placeholder="abc123..."
            onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }}
          />
        </div>

        {/* Client Secret */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
            Client Secret *
          </label>
          <div style={{ position: "relative" }}>
            <input
              ref={secretRef}
              style={{ ...inputStyle, paddingRight: 38 }}
              type={showSecret ? "text" : "password"}
              value={state.authentik_client_secret}
              onChange={(e) => patch("authentik_client_secret", e.target.value)}
              placeholder="Geheimnis eingeben oder leer lassen"
              autoComplete="new-password"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#2563E8";
                // Platzhalter-Bullets beim Fokus leeren damit der User neu eingibt
                if (/^[•]+$/.test(state.authentik_client_secret)) {
                  patch("authentik_client_secret", "");
                }
              }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }}
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              tabIndex={-1}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7A8BA6", display: "flex" }}
            >
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Default-Rolle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
            Standard-Rolle neuer Nutzer
          </label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={state.authentik_default_role}
            onChange={(e) => patch("authentik_default_role", e.target.value)}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p style={{ margin: 0, fontSize: 11, color: "#4A5B6F" }}>Rolle beim ersten SSO-Login zugewiesen</p>
        </div>

        {/* Authentik-Doku-Link */}
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <a
            href="https://docs.goauthentik.io/docs/add-secure-apps/providers/oauth2"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#5B87C5", textDecoration: "none" }}
          >
            <ExternalLink size={12} />
            Authentik OAuth2-Dokumentation
          </a>
        </div>
      </div>

      {/* Redirect-URL-Box */}
      <UrlReferenceBox />

      {/* Aktionen */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={save}
          disabled={saving || !dirty}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 18px", background: dirty ? "#2563E8" : "#1A2640",
            border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
            color: dirty ? "#fff" : "#4A5B6F",
            cursor: saving || !dirty ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1, transition: "all 150ms",
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {saving ? "Speichern…" : "Speichern"}
        </button>

        {msg && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: msg.ok ? "#34D399" : "#F87171" }}>
            {msg.ok ? <Check size={12} /> : <X size={12} />}
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}
