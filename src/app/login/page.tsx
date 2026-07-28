"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";

function HexLogo() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <path d="M20 2L35 11V29L20 38L5 29V11Z" fill="#2563E8" stroke="#22D3EE" strokeWidth="1.2" />
      <path d="M20 8L29 13V23L20 28L11 23V13Z" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">SB</text>
    </svg>
  );
}

function DSInput({ icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <span style={{ position: "absolute", left: 12, color: "#7A8BA6", pointerEvents: "none", display: "flex" }}>
        {icon}
      </span>
      <input
        {...props}
        style={{
          width: "100%", padding: "10px 14px 10px 38px",
          background: "#1A2640", border: "1px solid #1E3050", borderRadius: 9,
          color: "#EDF2F7", fontSize: 14, outline: "none", fontFamily: "inherit",
          transition: "border-color 150ms",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; props.onFocus?.(e); }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; props.onBlur?.(e); }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: fd.get("email") as string,
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

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0B1220", position: "relative", overflow: "hidden",
    }}>
      {/* Ambient Glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 320, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(37,99,232,0.14) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 400, padding: "0 20px" }}>

        {/* Logo + Titel */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <HexLogo />
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, letterSpacing: ".06em", color: "#EDF2F7", margin: 0 }}>
                STACK·BASE
              </p>
              <p style={{ fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: "3px 0 0" }}>
                One Platform. All Ops.
              </p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#7A8BA6", margin: 0 }}>
            Melde dich an um fortzufahren
          </p>
        </div>

        {/* Login-Card */}
        <div style={{
          background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14,
          padding: 28, backdropFilter: "blur(8px)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* E-Mail */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
                E-Mail
              </label>
              <DSInput
                id="email" name="email" type="email"
                autoComplete="email" required placeholder="admin@example.de"
                icon={<Mail size={14} />}
              />
            </div>

            {/* Passwort */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
                Passwort
              </label>
              <DSInput
                id="password" name="password" type="password"
                autoComplete="current-password" required
                icon={<Lock size={14} />}
              />
            </div>

            {/* Fehler */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 8,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                fontSize: 13, color: "#F87171",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "11px 16px", borderRadius: 9,
                background: "#2563E8", color: "#ffffff",
                fontSize: 14, fontWeight: 600, border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "opacity 150ms",
                marginTop: 2,
              }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Anmelden
            </button>
          </form>

          {process.env.NEXT_PUBLIC_AUTHENTIK_ENABLED === "true" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                <div style={{ flex: 1, height: 1, background: "#1E3050" }} />
                <span style={{ fontSize: 10, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".12em" }}>
                  oder
                </span>
                <div style={{ flex: 1, height: 1, background: "#1E3050" }} />
              </div>
              <button
                type="button"
                onClick={() => signIn("authentik", { callbackUrl: "/dashboard" })}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px 16px", borderRadius: 9,
                  background: "transparent", color: "#7A8BA6",
                  fontSize: 13, fontWeight: 500, border: "1px solid #1E3050",
                  cursor: "pointer", transition: "border-color 150ms, color 150ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(37,99,232,0.4)"; e.currentTarget.style.color = "#EDF2F7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1E3050"; e.currentTarget.style.color = "#7A8BA6"; }}
              >
                Mit Authentik SSO anmelden
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
