"use client";

import Link from "next/link";
import { User, ChevronRight } from "lucide-react";

interface Props {
  name: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
}

export function ProfileLink({ name, email, avatarUrl, initials }: Props) {
  return (
    <Link href="/profile" style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "#111C2D", border: "1px solid #1E3050",
          borderRadius: 12, padding: "14px 18px", cursor: "pointer",
          transition: "border-color 150ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(37,99,232,0.4)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E3050")}
      >
        <div style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: "rgba(37,99,232,0.15)", border: "2px solid rgba(37,99,232,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, color: "#2563E8", overflow: "hidden",
        }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials
          }
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>{name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#7A8BA6" }}>{email}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#7A8BA6" }}>
          <User size={13} />
          Profil bearbeiten
          <ChevronRight size={13} />
        </div>
      </div>
    </Link>
  );
}
