"use client";

import { useEffect, useState } from "react";
import { Megaphone, Pin, ChevronRight } from "lucide-react";
import Link from "next/link";

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

export function AnnouncementsWidget() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <Megaphone size={11} /> Ankündigungen
        </p>
        <Link href="/announcements" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#7A8BA6", textDecoration: "none" }}>
          Alle <ChevronRight size={11} />
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((a) => (
          <div key={a.id} style={{ padding: "8px 10px", background: a.pinned ? "rgba(37,99,232,0.08)" : "#0B1220", borderRadius: 8, border: `1px solid ${a.pinned ? "#2563E830" : "#1A2640"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              {a.pinned && <Pin size={10} style={{ color: "#2563E8", flexShrink: 0 }} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", flex: 1 }}>{a.title}</span>
              <span style={{ fontSize: 10, color: "#4A5B6F", whiteSpace: "nowrap" }}>{fmt(a.createdAt)}</span>
            </div>
            <p style={{ fontSize: 11, color: "#7A8BA6", margin: 0, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {a.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
