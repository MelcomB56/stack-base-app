"use client";

import { useState } from "react";
import { Check, Loader2, AlertCircle, Eye, EyeOff, Lock } from "lucide-react";

function DSPasswordInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
        {label}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{ position: "absolute", left: 11, color: "#7A8BA6", display: "flex", pointerEvents: "none" }}>
          <Lock size={13} />
        </span>
        <input
          {...props}
          type={visible ? "text" : "password"}
          style={{
            width: "100%", padding: "9px 36px 9px 32px", background: "#1A2640",
            border: `1px solid ${focused ? "#2563E8" : "#1E3050"}`, borderRadius: 8,
            color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit",
            transition: "border-color 150ms",
          }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", color: "#7A8BA6", display: "flex", padding: 2 }}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    </div>
  );
}

export function PasswordChangeForm() {
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  const mismatch = next.length > 0 && confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 8;
  const valid    = current.length > 0 && next.length >= 8 && next === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/user/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });

    if (res.ok) {
      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } else {
      const data = await res.json().catch(() => ({ error: "Unbekannter Fehler" }));
      setError(data.error ?? "Fehler beim Speichern");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <DSPasswordInput
        label="Aktuelles Passwort"
        value={current}
        onChange={(e) => { setCurrent(e.target.value); setSuccess(false); }}
        autoComplete="current-password"
        required
      />

      <DSPasswordInput
        label="Neues Passwort"
        value={next}
        onChange={(e) => { setNext(e.target.value); setSuccess(false); }}
        autoComplete="new-password"
        required
      />
      {tooShort && (
        <p style={{ fontSize: 11, color: "#FB923C", margin: "-8px 0 0" }}>Mindestens 8 Zeichen erforderlich.</p>
      )}

      <DSPasswordInput
        label="Neues Passwort bestätigen"
        value={confirm}
        onChange={(e) => { setConfirm(e.target.value); setSuccess(false); }}
        autoComplete="new-password"
        required
      />
      {mismatch && (
        <p style={{ fontSize: 11, color: "#F87171", margin: "-8px 0 0" }}>Passwörter stimmen nicht überein.</p>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#F87171" }}>
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {success && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", fontSize: 12, color: "#34D399" }}>
          <Check size={13} style={{ flexShrink: 0 }} />
          Passwort erfolgreich geändert.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={!valid || saving}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 18px", background: "#2563E8", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: !valid || saving ? "not-allowed" : "pointer",
            opacity: !valid || saving ? 0.55 : 1,
            transition: "opacity 150ms",
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Passwort ändern
        </button>
      </div>
    </form>
  );
}
