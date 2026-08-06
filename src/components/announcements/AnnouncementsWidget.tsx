"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";

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

function getEmoji(title: string, pinned: boolean): string {
  const t = title.toLowerCase();
  if (pinned || t.includes("online") || t.includes("launch") || t.includes("live")) return "🎉";
  if (t.includes("wartung") || t.includes("maintenance") || t.includes("update") && t.includes("system")) return "🔧";
  if (t.includes("security") || t.includes("sicherheit") || t.includes("schwachstelle") || t.includes("patch")) return "🛡️";
  if (t.includes("feature") || t.includes("neu") || t.includes("new") || t.includes("assistant") || t.includes("verfügbar")) return "✨";
  if (t.includes("release") || t.includes("version")) return "🚀";
  if (t.includes("warnung") || t.includes("incident") || t.includes("störung")) return "⚠️";
  return "📢";
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
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: ".18em",
          textTransform: "uppercase", color: "#7A8BA6",
          margin: 0, display: "flex", alignItems: "center", gap: 6,
        }}>
          <Megaphone size={11} /> Ankündigungen
        </p>
        <Link href="/announcements" style={{ fontSize: 11, color: "#7A8BA6", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          Alle anzeigen →
        </Link>
      </div>

      {/* Body: two-column */}
      <div style={{ display: "grid", gridTemplateColumns: rest.length > 0 ? "1fr 1fr" : "1fr", minHeight: 100 }}>

        {/* Featured */}
        <div style={{
          padding: "20px 22px",
          borderRight: rest.length > 0 ? "1px solid #1E3050" : "none",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>{getEmoji(featured.title, featured.pinned)}</span>
            <div style={{
              display: "inline-flex", alignItems: "center",
              padding: "2px 8px", borderRadius: 20,
              background: featured.pinned ? "rgba(37,99,232,0.18)" : "rgba(16,185,129,0.15)",
              border: `1px solid ${featured.pinned ? "rgba(37,99,232,0.35)" : "rgba(16,185,129,0.3)"}`,
              fontSize: 10, fontWeight: 700, letterSpacing: ".06em",
              color: featured.pinned ? "#60A5FA" : "#34D399",
            }}>
              {featured.pinned ? "ANGEHEFTET" : "NEU"}
            </div>
          </div>
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#EDF2F7", lineHeight: 1.3 }}>
              {featured.title}
            </h3>
            <p style={{
              margin: 0, fontSize: 12, color: "#8FA3BE", lineHeight: 1.6,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
            }}>
              {featured.content}
            </p>
          </div>
          <span style={{ fontSize: 10, color: "#4A5B6F" }}>{fmt(featured.createdAt)}</span>
        </div>

        {/* Compact list */}
        {rest.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rest.map((a, i) => (
              <div
                key={a.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "13px 18px",
                  borderBottom: i < rest.length - 1 ? "1px solid #1A2A3F" : "none",
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
                  {getEmoji(a.title, a.pinned)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: "0 0 2px", fontSize: 12, fontWeight: 500, color: "#C8D8E8",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {a.title}
                  </p>
                </div>
                <span style={{ fontSize: 10, color: "#4A5B6F", whiteSpace: "nowrap", flexShrink: 0, paddingTop: 1 }}>
                  {fmt(a.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
