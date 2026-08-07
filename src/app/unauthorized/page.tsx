import Link from "next/link";
import { signOut } from "@/auth";

export default function UnauthorizedPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "1rem", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: "4rem" }}>🔒</div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Kein Zugriff</h1>
      <p style={{ color: "#6b7280", margin: 0, textAlign: "center", maxWidth: 360 }}>
        Du hast nicht die erforderlichen Berechtigungen für diese Seite.
        Wende dich an einen Administrator, um Zugriff zu erhalten.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <Link href="/dashboard" style={{ padding: "0.5rem 1rem", borderRadius: 6, background: "#1e293b", color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem" }}>
          Startseite
        </Link>
        <form action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}>
          <button type="submit" style={{ padding: "0.5rem 1rem", borderRadius: 6, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.875rem" }}>
            Abmelden
          </button>
        </form>
      </div>
    </div>
  );
}
