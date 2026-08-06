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
    return { icon: <Megaphone size={22} />, bg: "linear-gradient(135deg,#102060 0%,#1d4ed8 100%)", color: "#93C5FD" };
  if (t.includes("security") || t.includes("sicherheit") || t.includes("schwachstelle") || t.includes("schutz"))
    return { icon: <Shield size={22} />, bg: "linear-gradient(135deg,#063d2f 0%,#059669 100%)", color: "#6EE7B7" };
  if (t.includes("feature") || t.includes("code") || t.includes("update") || t.includes("test") || t.includes("new"))
    return { icon: <Code2 size={22} />, bg: "linear-gradient(135deg,#1a1740 0%,#4338ca 100%)", color: "#A5B4FC" };
  if (t.includes("wartung") || t.includes("maintenance") || t.includes("geplant"))
    return { icon: <Wrench size={22} />, bg: "linear-gradient(135deg,#6b2a04 0%,#c2410c 100%)", color: "#FCA5A5" };
  if (t.includes("release") || t.includes("version") || t.includes("deploy"))
    return { icon: <Rocket size={22} />, bg: "linear-gradient(135deg,#0c3347 0%,#0369a1 100%)", color: "#7DD3FC" };
  return { icon: <Bell size={22} />, bg: "linear-gradient(135deg,#6b2a04 0%,#c05611 100%)", color: "#FDBA74" };
}

function getIconSmall(title: string): { icon: React.ReactNode; bg: string; color: string } {
  const t = title.toLowerCase();
  if (t.includes("online") || t.includes("launch") || t.includes("live") || t.includes("wir") || t.includes("news"))
    return { icon: <Megaphone size={14} />, bg: "linear-gradient(135deg,#102060 0%,#1d4ed8 100%)", color: "#93C5FD" };
  if (t.includes("security") || t.includes("sicherheit") || t.includes("schwachstelle") || t.includes("schutz"))
    return { icon: <Shield size={14} />, bg: "linear-gradient(135deg,#063d2f 0%,#059669 100%)", color: "#6EE7B7" };
  if (t.includes("feature") || t.includes("code") || t.includes("update") || t.includes("test") || t.includes("new"))
    return { icon: <Code2 size={14} />, bg: "linear-gradient(135deg,#1a1740 0%,#4338ca 100%)", color: "#A5B4FC" };
  if (t.includes("wartung") || t.includes("maintenance") || t.includes("geplant"))
    return { icon: <Wrench size={14} />, bg: "linear-gradient(135deg,#6b2a04 0%,#c2410c 100%)", color: "#FCA5A5" };
  if (t.includes("release") || t.includes("version") || t.includes("deploy"))
    return { icon: <Rocket size={14} />, bg: "linear-gradient(135deg,#0c3347 0%,#0369a1 100%)", color: "#7DD3FC" };
  return { icon: <Bell size={14} />, bg: "linear-gradient(135deg,#6b2a04 0%,#c05611 100%)", color: "#FDBA74" };
}

export function AnnouncementsWidget() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const [featured, ...rest] = items;
  const featIcon = getIcon(featured.title);

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
        padding: "11px 18px",
        borderBottom: "1px solid #1E3050",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Megaphone size={11} style={{ color: "#7A8BA6" }} />
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

      {/* Body: zwei Spalten */}
      <div style={{ display: "grid", gridTemplateColumns: rest.length > 0 ? "1fr 1fr" : "1fr" }}>

        {/* Featured (links) */}
        <div style={{
          padding: "18px 20px",
          borderRight: rest.length > 0 ? "1px solid #1E3050" : "none",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Icon-Box */}
            <div style={{
              width: 48, height: 48, borderRadius: 11, flexShrink: 0,
              background: featIcon.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: featIcon.color,
              boxShadow: `0 2px 12px ${featIcon.color}22`,
            }}>
              {featIcon.icon}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center",
              padding: "2px 8px", borderRadius: 99,
              background: featured.pinned ? "rgba(37,99,232,0.18)" : "rgba(16,185,129,0.15)",
              border: `1px solid ${featured.pinned ? "rgba(37,99,232,0.35)" : "rgba(16,185,129,0.3)"}`,
              fontSize: 9, fontWeight: 800, letterSpacing: ".08em",
              color: featured.pinned ? "#60A5FA" : "#34D399",
            }}>
              {featured.pinned ? "ANGEHEFTET" : "NEU"}
            </div>
          </div>
          <div>
            <h3 style={{ margin: "0 0 5px", fontSize: 14, fontWeight: 700, color: "#EDF2F7", lineHeight: 1.3 }}>
              {featured.title}
            </h3>
            <p style={{
              margin: 0, fontSize: 11, color: "#8FA3BE", lineHeight: 1.6,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
            }}>
              {featured.content}
            </p>
          </div>
          <span style={{ fontSize: 10, color: "#4A5B6F" }}>{fmt(featured.createdAt)}</span>
        </div>

        {/* Kompaktliste (rechts) */}
        {rest.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rest.slice(0, 4).map((a, i, arr) => {
              const si = getIconSmall(a.title);
              return (
                <div
                  key={a.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "11px 16px",
                    borderBottom: i < arr.length - 1 ? "1px solid #1A2A3D" : "none",
                  }}
                >
                  {/* Icon-Box klein */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                    background: si.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: si.color,
                  }}>
                    {si.icon}
                  </div>
                  <p style={{
                    flex: 1, margin: 0, fontSize: 11, fontWeight: 500, color: "#C8D8E8",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {a.title}
                  </p>
                  <span style={{ fontSize: 10, color: "#4A5B6F", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {fmt(a.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
