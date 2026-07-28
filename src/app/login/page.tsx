"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";

// ─── Logo ──────────────────────────────────────────────────────────────────

function HexLogo() {
  return (
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
      <path d="M20 2L35 11V29L20 38L5 29V11Z" fill="#2563E8" />
      <path d="M20 8L29 13V23L20 28L11 23V13Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">SB</text>
    </svg>
  );
}

// ─── Provider-Icons ────────────────────────────────────────────────────────

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="0"  y="0"  width="8.5" height="8.5" fill="#F25022" />
      <rect x="9.5" y="0"  width="8.5" height="8.5" fill="#7FBA00" />
      <rect x="0"  y="9.5" width="8.5" height="8.5" fill="#00A4EF" />
      <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57C21.36 18.45 22.56 15.63 22.56 12.25z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

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
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(true);

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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <HexLogo />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: ".1em", color: "#EDF2F7" }}>
            STACK·BASE
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EDF2F7", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
          Willkommen zurück!
        </h1>
        <p style={{ fontSize: 13, color: "#6B7E99", margin: "0 0 24px" }}>
          Melde dich an, um fortzufahren.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 18px" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          <span style={{ fontSize: 11, color: "#4A5A70", letterSpacing: ".08em" }}>oder weiter mit</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Social-Provider-Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          {[
            { icon: <MicrosoftIcon />, label: "Microsoft",  provider: "azure-ad" },
            { icon: <GoogleIcon />,    label: "Google",     provider: "google" },
            { icon: <AuthentikIcon />, label: "Authentik",  provider: "authentik" },
          ].map(({ icon, label, provider }) => (
            <button
              key={provider}
              type="button"
              title={`Anmelden mit ${label}`}
              onClick={() => signIn(provider, { callbackUrl: "/dashboard" })}
              style={{
                width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer", transition: "background 150ms, border-color 150ms",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = "rgba(255,255,255,0.09)";
                b.style.borderColor = "rgba(255,255,255,0.16)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = "rgba(255,255,255,0.04)";
                b.style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              {icon}
            </button>
          ))}
        </div>

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
