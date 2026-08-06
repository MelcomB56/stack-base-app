"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Topbar() {
  const { data: session } = useSession();
  const [q, setQ] = useState("");
  const router = useRouter();

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header style={{
      height: 56,
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "0 24px",
      borderBottom: "1px solid #1E3050",
      background: "rgba(11,18,32,0.85)",
      backdropFilter: "blur(8px)",
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }} />

      {/* Suche */}
      <form onSubmit={handleSearch} style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <svg
          style={{ position: "absolute", left: 10, color: "#7A8BA6", pointerEvents: "none" }}
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suchen…"
          style={{
            width: 220,
            padding: "7px 12px 7px 32px",
            background: "#111C2D",
            border: "1px solid #1E3050",
            borderRadius: 8,
            color: "#EDF2F7",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }}
        />
      </form>

      {/* Bell */}
      <button
        style={{
          position: "relative", width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, color: "#7A8BA6",
          background: "none", border: "none", cursor: "pointer",
          transition: "background 150ms",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#111C2D"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <span style={{
          position: "absolute", top: 6, right: 6,
          width: 8, height: 8, borderRadius: "50%",
          background: "#F59E0B", border: "2px solid #0B1220",
        }} />
      </button>

      {/* Avatar */}
      <a href="/profile" style={{ textDecoration: "none" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(37,99,232,0.15)", border: "1px solid rgba(37,99,232,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: "#2563E8", cursor: "pointer",
          overflow: "hidden",
        }}>
          {session?.user?.image
            ? <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials
          }
        </div>
      </a>
    </header>
  );
}
