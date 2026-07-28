import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Settings, User, Shield, Bell } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const user = userId
    ? await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
      })
    : null;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  function fmt(d: Date | null | undefined) {
    if (!d) return "—";
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(d);
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Settings size={18} className="text-primary" />
          Einstellungen
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Profil und Systemkonfiguration</p>
      </div>

      {/* Profil */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <User size={12} />
          Profil
        </p>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary">{initials}</span>
          </div>
          <div>
            <p className="font-semibold">{user?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-border/50">
          <div>
            <p className="text-muted-foreground mb-1">Rolle</p>
            <p className="font-semibold">{user?.role ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Mitglied seit</p>
            <p className="font-semibold">{fmt(user?.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Letzter Login</p>
            <p className="font-semibold">{fmt(user?.lastLoginAt)}</p>
          </div>
        </div>
      </section>

      {/* Sicherheit */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Shield size={12} />
          Sicherheit
        </p>
        <p className="text-sm text-muted-foreground">
          Passwort-Änderung und 2FA-Konfiguration folgen in einer späteren Version.
        </p>
      </section>

      {/* Benachrichtigungen */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Bell size={12} />
          Benachrichtigungen
        </p>
        <p className="text-sm text-muted-foreground">
          Webhook- und E-Mail-Benachrichtigungen folgen in einer späteren Version.
        </p>
      </section>
    </div>
  );
}
