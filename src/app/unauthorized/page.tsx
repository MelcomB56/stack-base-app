import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "1rem", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: "4rem" }}>🔒</div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Kein Zugriff</h1>
      <p style={{ color: "#6b7280", margin: 0, textAlign: "center", maxWidth: 360 }}>
        Du hast nicht die erforderlichen Berechtigungen für diese Seite.
        Wende dich an einen Administrator, um Zugriff zu erhalten.
      </p>
      <Link href="/dashboard" style={{ marginTop: "0.5rem", color: "#3b82f6", textDecoration: "underline" }}>
        Zur Startseite
      </Link>
    </div>
  );
}
