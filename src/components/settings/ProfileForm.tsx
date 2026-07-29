"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Loader2, AlertCircle, User, Mail } from "lucide-react";

function DSInput({ label, icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
        {label}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{ position: "absolute", left: 11, color: "#7A8BA6", display: "flex", pointerEvents: "none" }}>
          {icon}
        </span>
        <input
          {...props}
          style={{
            width: "100%", padding: "9px 12px 9px 32px",
            background: "#1A2640",
            border: `1px solid ${focused ? "#2563E8" : "#1E3050"}`,
            borderRadius: 8, color: "#EDF2F7", fontSize: 13,
            outline: "none", fontFamily: "inherit", transition: "border-color 150ms",
          }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
      </div>
    </div>
  );
}

export function ProfileForm({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const { update } = useSession();
  const [name,    setName]    = useState(initialName);
  const [email,   setEmail]   = useState(initialEmail);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dirty = name !== initialName || email !== initialEmail;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    if (res.ok) {
      await update({ name, email });
      setSuccess(true);
    } else {
      const data = await res.json().catch(() => ({ error: "Unbekannter Fehler" }));
      setError(data.error ?? "Fehler beim Speichern");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <DSInput
        label="Name"
        icon={<User size={13} />}
        value={name}
        onChange={(e) => { setName(e.target.value); setSuccess(false); }}
        required
        minLength={2}
        maxLength={100}
        autoComplete="name"
      />
      <DSInput
        label="E-Mail"
        icon={<Mail size={13} />}
        value={email}
        onChange={(e) => { setEmail(e.target.value); setSuccess(false); }}
        type="email"
        required
        maxLength={200}
        autoComplete="email"
      />

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#F87171" }}>
          <AlertCircle size={13} style={{ flexShrink: 0 }} />{error}
        </div>
      )}

      {success && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", fontSize: 12, color: "#34D399" }}>
          <Check size={13} style={{ flexShrink: 0 }} />Profil erfolgreich aktualisiert.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={!dirty || saving}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 18px", background: "#2563E8", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: !dirty || saving ? "not-allowed" : "pointer",
            opacity: !dirty || saving ? 0.55 : 1, transition: "opacity 150ms",
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Speichern
        </button>
      </div>
    </form>
  );
}
