"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, Shield, Code2, Bell, Wrench, Rocket } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  audience: string;
  createdAt: string;
}

function fmt(d: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(new Date(d));
}

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 4 * 24 * 60 * 60 * 1000;
}

function getIcon(title: string): { icon: React.ReactNode; bg: string; color: string } {
  const t = title.toLowerCase();
  if (t.includes("online") || t.includes("launch") || t.includes("live") || t.includes("wir") || t.includes("news"))
    return { icon: <Megaphone size={20} />, bg: "linear-gradient(135deg,#102060 0%,#1d4ed8 100%)", color: "#93C5FD" };
  if (t.includes("security") || t.includes("sicherheit") || t.includes("schwachstelle") || t.includes("schutz"))
    return { icon: <Shield size={20} />, bg: "linear-gradient(135deg,#063d2f 0%,#059669 100%)", color: "#6EE7B7" };
  if (t.includes("feature") || t.includes("code") || t.includes("update") || t.includes("test") || t.includes("new"))
    return { icon: <Code2 size={20} />, bg: "linear-gradient(135deg,#1a1740 0%,#4338ca 100%)", color: "#A5B4FC" };
  if (t.includes("wartung") || t.includes("maintenance") || t.includes("geplant"))
    return { icon: <Wrench size={20} />, bg: "linear-gradient(135deg,#6b2a04 0%,#c2410c 100%)", color: "#FCA5A5" };
  if (t.includes("release") || t.includes("version") || t.includes("deploy"))
    return { icon: <Rocket size={20} />, bg: "linear-gradient(135deg,#0c3347 0%,#0369a1 100%)", color: "#7DD3FC" };
  return { icon: <Bell size={20} />, bg: "linear-gradient(135deg,#6b2a04 0%,#c05611 100%)", color: "#FDBA74" };
}

export function AnnouncementsWidget() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div style={{
      background: "#111C2D",
      border: "1px solid #1E3050",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 18px",
        borderBottom: "1px solid #1E3050",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Megaphone size={12} style={{ color: "#7A8BA6" }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#7A8BA6" }}>
            Ankündigungen
          </span>
          <span style={{
            minWidth: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 99, background: "#2563E8", color: "#fff", fontSize: 9, fontWeight: 700, padding: "0 5px",
          }}>{items.length}</span>
        </div>
        <Link href="/announcements" style={{ fontSize: 11, color: "#7A8BA6", textDecoration: "none" }}>
          Alle anzeigen →
        </Link>
      </div>

      {/* Karten */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((a, i) => {
          const { icon, bg, color } = getIcon(a.title);
          const neu = isNew(a.createdAt);
          return (
            <Link
              key={a.id}
              href="/announcements"
              style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "14px 18px",
                borderBottom: i < items.length - 1 ? "1px solid #1A2A3D" : "none",
                textDecoration: "none",
                transition: "background 120ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#0D1829"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
            >
              {/* Icon-Box */}
              <div style={{
                width: 46, height: 46, borderRadius: 10, flexShrink: 0,
                background: bg, display: "flex", alignItems: "center", justifyContent: "center",
                color, boxShadow: `0 2px 10px ${color}22`,
              }}>
                {icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.title}
                  </span>
                  {neu && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: ".08em",
                      padding: "1px 6px", borderRadius: 99, flexShrink: 0,
                      background: "rgba(37,99,232,0.2)", border: "1px solid rgba(37,99,232,0.35)",
                      color: "#60A5FA",
                    }}>NEU</span>
                  )}
                  <span style={{ fontSize: 10, color: "#4A5B6F", marginLeft: "auto", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {fmt(a.createdAt)}
                  </span>
                </div>
                <p style={{
                  fontSize: 11, color: "#7A8BA6", margin: 0, lineHeight: 1.55,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                }}>
                  {a.content}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
