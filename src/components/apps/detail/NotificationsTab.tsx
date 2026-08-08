"use client";

import { useState, useCallback } from "react";
import { Bell, Trash2, Plus, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useCan } from "@/lib/permissions-context";

type NotificationSetting = {
  id: string;
  email: string;
  onStatusChange: boolean;
  onIncident: boolean;
  onRelease: boolean;
};

interface Props {
  appSlug: string;
  initial: NotificationSetting[];
  emailConfigured: boolean;
}

const TRIGGER_META = [
  { key: "onStatusChange" as const, label: "Statuswechsel", desc: "E-Mail bei jeder Statusänderung (z.B. DEVELOPMENT → PRODUCTION)" },
  { key: "onIncident" as const, label: "Neues Incident", desc: "E-Mail wenn ein neues Incident gemeldet wird" },
  { key: "onRelease" as const, label: "Neues Release", desc: "E-Mail bei jedem neuen Release" },
];

export function NotificationsTab({ appSlug, initial, emailConfigured }: Props) {
  const canCreate = useCan("app_notifications.create");
  const canUpdate = useCan("app_notifications.update");
  const canDelete = useCan("app_notifications.delete");

  const [settings, setSettings] = useState<NotificationSetting[]>(initial);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const addRecipient = useCallback(async () => {
    const email = newEmail.trim();
    if (!email || !email.includes("@")) { setError("Ungültige E-Mail-Adresse"); return; }
    if (settings.some((s) => s.email === email)) { setError("Diese E-Mail-Adresse ist bereits eingetragen"); return; }

    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/apps/${appSlug}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, onStatusChange: true, onIncident: true, onRelease: false }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Fehler"); return; }
      const created: NotificationSetting = await res.json();
      setSettings((prev) => [...prev, created]);
      setNewEmail("");
    } finally {
      setAdding(false);
    }
  }, [appSlug, newEmail, settings]);

  const toggleTrigger = useCallback(async (id: string, key: keyof Omit<NotificationSetting, "id" | "email">, value: boolean) => {
    setSaving(id + key);
    try {
      const res = await fetch(`/api/apps/${appSlug}/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        setSettings((prev) => prev.map((s) => s.id === id ? { ...s, [key]: value } : s));
      }
    } finally {
      setSaving(null);
    }
  }, [appSlug]);

  const remove = useCallback(async (id: string, email: string) => {
    if (!confirm(`${email} aus Benachrichtigungen entfernen?`)) return;
    const res = await fetch(`/api/apps/${appSlug}/notifications/${id}`, { method: "DELETE" });
    if (res.ok) setSettings((prev) => prev.filter((s) => s.id !== id));
  }, [appSlug]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>

      {/* SMTP-Status */}
      {!emailConfigured && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderRadius: 10, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)" }}>
          <XCircle size={16} style={{ color: "#EAB308", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#EAB308" }}>SMTP nicht konfiguriert</p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#7A8BA6" }}>
              Setze <code style={{ fontFamily: "monospace", color: "#EDF2F7", background: "#1A2640", padding: "1px 5px", borderRadius: 4 }}>SMTP_HOST</code>, <code style={{ fontFamily: "monospace", color: "#EDF2F7", background: "#1A2640", padding: "1px 5px", borderRadius: 4 }}>SMTP_USER</code> und <code style={{ fontFamily: "monospace", color: "#EDF2F7", background: "#1A2640", padding: "1px 5px", borderRadius: 4 }}>SMTP_PASS</code> in der <code style={{ fontFamily: "monospace", color: "#EDF2F7", background: "#1A2640", padding: "1px 5px", borderRadius: 4 }}>.env</code>-Datei, um E-Mails zu versenden.
              Einstellungen können trotzdem gespeichert werden.
            </p>
          </div>
        </div>
      )}

      {emailConfigured && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", fontSize: 13, color: "#10B981" }}>
          <CheckCircle size={15} />
          SMTP konfiguriert — E-Mails werden versendet.
        </div>
      )}

      {/* Empfänger hinzufügen */}
      {canCreate && <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18 }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#EDF2F7", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} style={{ color: "#2563E8" }} />
          Empfänger hinzufügen
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => { setNewEmail(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && addRecipient()}
            placeholder="name@example.com"
            style={{
              flex: 1, background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8,
              padding: "8px 12px", fontSize: 13, color: "#EDF2F7", outline: "none",
            }}
          />
          <button
            onClick={addRecipient}
            disabled={adding || !newEmail}
            style={{
              padding: "8px 16px", borderRadius: 8, background: adding || !newEmail ? "#1A2640" : "#2563E8",
              border: "none", color: adding || !newEmail ? "#7A8BA6" : "#EDF2F7", fontSize: 13,
              fontWeight: 600, cursor: adding || !newEmail ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {adding ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={13} />}
            Hinzufügen
          </button>
        </div>
        {error && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#F87171" }}>{error}</p>}
      </div>}

      {/* Empfänger-Liste */}
      {settings.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "40px 0", color: "#7A8BA6" }}>
          <Bell size={28} style={{ opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 14 }}>Noch keine Benachrichtigungs-Empfänger.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {settings.map((s) => (
            <div key={s.id} style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={14} style={{ color: "#2563E8" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#EDF2F7" }}>{s.email}</span>
                </div>
                {canDelete && (
                  <button
                    onClick={() => remove(s.id, s.email)}
                    style={{ background: "none", border: "none", color: "#7A8BA6", cursor: "pointer", padding: 4, display: "flex" }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {TRIGGER_META.map((t) => {
                  const active = s[t.key];
                  const isSaving = saving === s.id + t.key;
                  return (
                    <label key={t.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                      <div style={{ position: "relative", marginTop: 1 }}>
                        <input
                          type="checkbox"
                          checked={active}
                          disabled={!!saving}
                          onChange={(e) => toggleTrigger(s.id, t.key, e.target.checked)}
                          style={{ display: "none" }}
                        />
                        <div
                          onClick={() => canUpdate && !saving && toggleTrigger(s.id, t.key, !active)}
                          style={{
                            width: 36, height: 20, borderRadius: 10, transition: "background 150ms",
                            background: active ? "#2563E8" : "#1A2640",
                            border: `1px solid ${active ? "#2563E8" : "#2A3D5A"}`,
                            position: "relative", cursor: !canUpdate || saving ? "not-allowed" : "pointer",
                          }}
                        >
                          <div style={{
                            position: "absolute", top: 2, left: active ? 18 : 2,
                            width: 14, height: 14, borderRadius: "50%",
                            background: active ? "#EDF2F7" : "#7A8BA6",
                            transition: "left 150ms",
                          }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: active ? "#EDF2F7" : "#7A8BA6", display: "flex", alignItems: "center", gap: 6 }}>
                          {t.label}
                          {isSaving && <Loader2 size={11} style={{ animation: "spin 1s linear infinite", color: "#2563E8" }} />}
                        </div>
                        <div style={{ fontSize: 11, color: "#7A8BA6", marginTop: 1 }}>{t.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
