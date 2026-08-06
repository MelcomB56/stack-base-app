"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";

function AuthentikIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 5.5V12c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11V5.5L12 2z" fill="rgba(37,99,232,0.2)" stroke="#2563E8" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Haupt-Seite ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [showPw, setShowPw]             = useState(false);
  const [remember, setRemember]         = useState(true);
  const [ssoEnabled, setSsoEnabled]     = useState(false);
  const [ssoLabel, setSsoLabel]         = useState("Mit Authentik anmelden");
  const [ssoLoading, setSsoLoading]     = useState(false);

  useEffect(() => {
    fetch("/api/auth/sso-status")
      .then((r) => r.json())
      .then((d) => {
        setSsoEnabled(!!d.authentikEnabled);
        if (d.authentikLabel) setSsoLabel(d.authentikLabel);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email:    fd.get("email") as string,
      password: fd.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("E-Mail oder Passwort ungültig.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  // ── shared field style helpers ──
  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 500, color: "#A0AEBF", display: "block", marginBottom: 6,
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#060D18",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow — top right */}
      <div style={{
        position: "absolute",
        top: -120,
        right: -120,
        width: 480,
        height: 480,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(37,99,232,0.14) 40%, transparent 70%)",
        pointerEvents: "none",
        filter: "blur(40px)",
      }} />
      {/* Secondary glow — bottom left */}
      <div style={{
        position: "absolute",
        bottom: -80,
        left: -80,
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(37,99,232,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
        filter: "blur(30px)",
      }} />

      {/* Card */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 360,
        margin: "0 20px",
        background: "rgba(13,21,40,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "32px 28px 28px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <img src="/logo.png" alt="Stack-Base" style={{ height: 48, width: "auto", objectFit: "contain" }} />
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#EDF2F7", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
          Willkommen zurück
        </h1>
        <p style={{ fontSize: 13, color: "#6B7E99", margin: "0 0 24px" }}>
          Melde dich an, um fortzufahren.
        </p>

        <form onSubmit={handleSubmit} method="post" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* E-Mail */}
          <div>
            <label htmlFor="email" style={labelStyle}>E-Mail Adresse</label>
            <EmailInput />
          </div>

          {/* Passwort */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
              <label htmlFor="password" style={{ ...labelStyle, marginBottom: 0 }}>Passwort</label>
              <a href="/forgot-password" style={{ fontSize: 12, color: "#5B87C5", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#93C5FD"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#5B87C5"; }}>
                Passwort vergessen?
              </a>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="password" name="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password" required
                style={{
                  width: "100%", padding: "10px 40px 10px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, color: "#EDF2F7", fontSize: 14,
                  outline: "none", fontFamily: "inherit", transition: "border-color 180ms",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,139,255,0.6)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B7E99", display: "flex", padding: 2 }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Angemeldet bleiben */}
          <div
            role="checkbox"
            aria-checked={remember}
            tabIndex={0}
            onClick={() => setRemember(!remember)}
            onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") setRemember(!remember); }}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}
          >
            <span style={{
              width: 17, height: 17, borderRadius: 4, flexShrink: 0,
              border: `1.5px solid ${remember ? "#2563E8" : "rgba(255,255,255,0.15)"}`,
              background: remember ? "#2563E8" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 150ms",
            }}>
              {remember && (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1.5 4.5L3.5 6.5L7.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <span style={{ fontSize: 13, color: "#A0AEBF" }}>Angemeldet bleiben</span>
          </div>

          {/* Fehler */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 13px", borderRadius: 8,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              fontSize: 13, color: "#F87171",
            }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px 16px", borderRadius: 9, marginTop: 2,
              background: "linear-gradient(90deg, #2563E8 0%, #7C3AED 100%)",
              color: "#fff", fontSize: 14, fontWeight: 600, border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.75 : 1,
              transition: "opacity 150ms, filter 150ms",
              boxShadow: "0 4px 20px rgba(37,99,232,0.35)",
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "none"; }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Anmelden
          </button>
        </form>

        {/* SSO-Button — nur wenn konfiguriert */}
        {ssoEnabled && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 18px" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize: 11, color: "#4A5A70", letterSpacing: ".08em" }}>oder weiter mit</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>
            <button
              type="button"
              onClick={async () => {
                setSsoLoading(true);
                await signIn("authentik", { callbackUrl: "/dashboard" });
              }}
              disabled={ssoLoading}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "11px 16px", borderRadius: 9,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                cursor: ssoLoading ? "not-allowed" : "pointer",
                opacity: ssoLoading ? 0.7 : 1,
                color: "#EDF2F7", fontSize: 14, fontWeight: 500,
                transition: "background 150ms, border-color 150ms",
              }}
              onMouseEnter={(e) => {
                if (!ssoLoading) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
              }}
            >
              {ssoLoading ? <Loader2 size={16} className="animate-spin" /> : <AuthentikIcon />}
              {ssoLabel}
            </button>
          </>
        )}

        {/* Footer */}
        <p style={{ fontSize: 12, color: "#4A5A70", textAlign: "center", margin: "20px 0 0" }}>
          Noch kein Konto?{" "}
          <span style={{ color: "#5B87C5" }}>Kontaktiere deinen Administrator.</span>
        </p>
      </div>
    </div>
  );
}

// ─── E-Mail Input als eigene Komponente (für Focus-State) ──────────────────

function EmailInput() {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id="email" name="email"
      type="email"
      autoComplete="email"
      required
      placeholder="name@stack-base.com"
      style={{
        width: "100%",
        padding: "10px 14px",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? "rgba(99,139,255,0.6)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 8,
        color: "#EDF2F7",
        fontSize: 14,
        outline: "none",
        fontFamily: "inherit",
        transition: "border-color 180ms",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}
