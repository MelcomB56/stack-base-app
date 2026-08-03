"use client";

import { useState } from "react";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface SmtpSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  smtp_secure: string;
}

export function SmtpSettingsForm({ initial }: { initial: Partial<SmtpSettings> }) {
  const [form, setForm] = useState<SmtpSettings>({
    smtp_host: initial.smtp_host ?? "",
    smtp_port: initial.smtp_port ?? "587",
    smtp_user: initial.smtp_user ?? "",
    smtp_pass: "",
    smtp_from: initial.smtp_from ?? "",
    smtp_secure: initial.smtp_secure ?? "false",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const inputStyle: React.CSSProperties = {
    background: "#0B1220", border: "1px solid #1E3050", borderRadius: 6,
    padding: "7px 10px", fontSize: 13, color: "#EDF2F7", outline: "none", width: "100%",
    boxSizing: "border-box",
  };

  function set(key: keyof SmtpSettings) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));
  }

  async function save() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/system/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaveMsg({ ok: true, text: "Einstellungen gespeichert" });
    } catch (e) {
      setSaveMsg({ ok: false, text: e instanceof Error ? e.message : "Fehler" });
    } finally {
      setSaving(false);
    }
  }

  async function test(sendMail = false) {
    setTesting(true);
    setTestMsg(null);
    // Erst speichern, dann testen
    try {
      await fetch("/api/system/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const res = await fetch("/api/system/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendMail ? { sendTest: true, to: form.smtp_user } : {}),
      });
      const data = await res.json();
      setTestMsg({ ok: data.ok, text: data.message ?? data.error ?? "Unbekannt" });
    } catch (e) {
      setTestMsg({ ok: false, text: e instanceof Error ? e.message : "Netzwerkfehler" });
    } finally {
      setTesting(false);
    }
  }

  const hasPass = !!initial.smtp_pass;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Host + Port */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>SMTP Host</label>
          <input style={inputStyle} placeholder="smtp.gmail.com" value={form.smtp_host} onChange={set("smtp_host")} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Port</label>
          <input style={inputStyle} placeholder="587" value={form.smtp_port} onChange={set("smtp_port")} type="number" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>TLS/SSL</label>
          <select
            style={{ ...inputStyle, padding: "7px 6px" }}
            value={form.smtp_secure}
            onChange={set("smtp_secure")}
          >
            <option value="false">STARTTLS</option>
            <option value="true">SSL/TLS</option>
          </select>
        </div>
      </div>

      {/* User + Pass */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Benutzername</label>
          <input style={inputStyle} placeholder="user@example.com" value={form.smtp_user} onChange={set("smtp_user")} autoComplete="off" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>
            Passwort{hasPass && <span style={{ marginLeft: 6, color: "#10B981", fontSize: 10 }}>✓ gesetzt</span>}
          </label>
          <input
            style={inputStyle}
            placeholder={hasPass ? "Leer lassen um beizubehalten" : "Passwort eingeben"}
            value={form.smtp_pass}
            onChange={set("smtp_pass")}
            type="password"
            autoComplete="new-password"
          />
        </div>
      </div>

      {/* From */}
      <div>
        <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Absender (From)</label>
        <input style={inputStyle} placeholder="Stack-Base <noreply@example.com>" value={form.smtp_from} onChange={set("smtp_from")} />
      </div>

      {/* Feedback */}
      {saveMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, fontSize: 12,
          background: saveMsg.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${saveMsg.ok ? "#10B98140" : "#EF444440"}`,
          color: saveMsg.ok ? "#10B981" : "#F87171",
        }}>
          {saveMsg.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
          {saveMsg.text}
        </div>
      )}
      {testMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, fontSize: 12,
          background: testMsg.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${testMsg.ok ? "#10B98140" : "#EF444440"}`,
          color: testMsg.ok ? "#10B981" : "#F87171",
        }}>
          {testMsg.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
          {testMsg.text}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 500,
            background: "#2563E8", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Speichern..." : "Speichern"}
        </button>
        <button
          onClick={() => test(false)}
          disabled={testing || !form.smtp_host}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 500,
            background: "transparent", border: "1px solid #1E3050", color: "#7A8BA6",
            cursor: (testing || !form.smtp_host) ? "not-allowed" : "pointer",
          }}
        >
          {testing ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Mail size={12} />}
          Verbindung testen
        </button>
        <button
          onClick={() => test(true)}
          disabled={testing || !form.smtp_host || !form.smtp_user}
          title={`Test-Mail an ${form.smtp_user || "smtp_user"} senden`}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 500,
            background: "transparent", border: "1px solid #1E3050", color: "#7A8BA6",
            cursor: (testing || !form.smtp_host || !form.smtp_user) ? "not-allowed" : "pointer",
          }}
        >
          {testing ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Mail size={12} />}
          Test-Mail senden
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
