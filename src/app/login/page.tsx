"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient-Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(37,99,232,0.12) 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 32 32" className="w-10 h-10 shrink-0" fill="none">
              <path
                d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
                fill="oklch(0.530 0.220 262)"
                stroke="oklch(0.735 0.155 194)"
                strokeWidth="1"
              />
              <path
                d="M16 7L23 11V19L16 23L9 19V11L16 7Z"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
              />
              <text x="16" y="20" textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="sans-serif">
                SB
              </text>
            </svg>
            <div>
              <p className="text-sm font-bold tracking-wide text-foreground">STACK·BASE</p>
              <p className="text-[9px] text-muted-foreground tracking-widest uppercase">One Platform. All Ops.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Melde dich an um fortzufahren</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-Mail */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                E-Mail
              </label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@example.de"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-background/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                />
              </div>
            </div>

            {/* Passwort */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Passwort
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-background/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                />
              </div>
            </div>

            {/* Fehler */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                {error}
              </div>
            )}

            {/* Anmelden */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-1"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Anmelden
            </button>
          </form>

          {process.env.NEXT_PUBLIC_AUTHENTIK_ENABLED === "true" && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">oder</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button
                type="button"
                onClick={() => signIn("authentik", { callbackUrl: "/dashboard" })}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
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
