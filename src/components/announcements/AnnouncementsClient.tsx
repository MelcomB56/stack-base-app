"use client";

import { useState } from "react";
import { useCan } from "@/lib/permissions-context";
import {
  Megaphone, Pin, PinOff, Trash2, Plus, X, Check, Info,
  MoreHorizontal, Shield, Code2, Bell, Wrench, Rocket,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  audience: string;
  createdAt: string;
  updatedAt: string;
}

function fmt(d: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(d));
}

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 4 * 24 * 60 * 60 * 1000;
}

function getIcon(title: string): { icon: React.ReactNode; bg: string; color: string } {
  const t = title.toLowerCase();
  if (t.includes("online") || t.includes("launch") || t.includes("live") || t.includes("news") || t.includes("wir"))
    return { icon: <Megaphone size={26} />, bg: "linear-gradient(135deg,#102060 0%,#1d4ed8 100%)", color: "#93C5FD" };
  if (t.includes("security") || t.includes("sicherheit") || t.includes("schwachstelle") || t.includes("schutz"))
    return { icon: <Shield size={26} />, bg: "linear-gradient(135deg,#063d2f 0%,#059669 100%)", color: "#6EE7B7" };
  if (t.includes("feature") || t.includes("code") || t.includes("update") || t.includes("test") || t.includes("new"))
    return { icon: <Code2 size={26} />, bg: "linear-gradient(135deg,#1a1740 0%,#4338ca 100%)", color: "#A5B4FC" };
  if (t.includes("wartung") || t.includes("maintenance") || t.includes("geplant"))
    return { icon: <Wrench size={26} />, bg: "linear-gradient(135deg,#6b2a04 0%,#c2410c 100%)", color: "#FCA5A5" };
  if (t.includes("release") || t.includes("version") || t.includes("deploy"))
    return { icon: <Rocket size={26} />, bg: "linear-gradient(135deg,#0c3347 0%,#0369a1 100%)", color: "#7DD3FC" };
  return { icon: <Bell size={26} />, bg: "linear-gradient(135deg,#6b2a04 0%,#c05611 100%)", color: "#FDBA74" };
}

const inputStyle: React.CSSProperties = {
  background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#EDF2F7", outline: "none",
  width: "100%", boxSizing: "border-box",
};

export function AnnouncementsClient({ initial }: { initial: Announcement[] }) {
  const canCreate = useCan("announcements.create");
  const canUpdate = useCan("announcements.update");
  const canDelete = useCan("announcements.delete");

  const [items, setItems]       = useState<Announcement[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ title: "", content: "", pinned: false, audience: "all" });
  const [error, setError]       = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  function setF(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  async function create() {
    if (!form.title || !form.content) { setError("Titel und Inhalt sind Pflichtfelder."); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Fehler"); return; }
      const a: Announcement = await res.json();
      setItems((p) => [a, ...p].sort((x, y) =>
        (y.pinned ? 1 : 0) - (x.pinned ? 1 : 0) ||
        new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
      ));
      setForm({ title: "", content: "", pinned: false, audience: "all" });
      setShowForm(false);
    } finally { setSaving(false); }
  }

  async function togglePin(id: string, pinned: boolean) {
    const res = await fetch(`/api/announcements/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !pinned }),
    });
    if (res.ok) {
      const updated: Announcement = await res.json();
      setItems((p) => p.map((a) => a.id === id ? updated : a)
        .sort((x, y) => (y.pinned ? 1 : 0) - (x.pinned ? 1 : 0) || new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()));
    }
    setMenuOpen(null);
  }

  async function remove(id: string) {
    if (!confirm("Ankündigung wirklich löschen?")) return;
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((a) => a.id !== id));
    setMenuOpen(null);
  }

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Megaphone size={22} style={{ color: "#2563E8" }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>Ankündigungen</h1>
          <span style={{
            minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 99, background: "#2563E8", color: "#fff",
            fontSize: 11, fontWeight: 700, padding: "0 6px",
          }}>{items.length}</span>
        </div>
        {canCreate && (
          <button
            onClick={() => { setShowForm(!showForm); setError(null); }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", background: "#2563E8", border: "none",
              borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer",
            }}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Abbrechen" : "Neue Ankündigung"}
          </button>
        )}
      </div>

      {/* Formular */}
      {canCreate && showForm && (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>Neue Ankündigung erstellen</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 5 }}>Titel *</label>
              <input style={inputStyle} placeholder="Ankündigungstitel" value={form.title} onChange={setF("title")} maxLength={200} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 5 }}>Zielgruppe</label>
                <select style={{ ...inputStyle, padding: "9px 10px" }} value={form.audience} onChange={setF("audience")}>
                  <option value="all">Alle</option>
                  <option value="admin">Nur Admins</option>
                  <option value="dev">Entwickler</option>
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#EDF2F7", paddingBottom: 10, whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={form.pinned} onChange={(e) => setForm((p) => ({ ...p, pinned: e.target.checked }))} style={{ width: 14, height: 14, accentColor: "#2563E8" }} />
                Anheften
              </label>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 5 }}>Inhalt *</label>
            <textarea style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} rows={4} placeholder="Inhalt der Ankündigung…" value={form.content} onChange={setF("content")} />
          </div>
          {error && <p style={{ fontSize: 12, color: "#F87171", margin: 0 }}>{error}</p>}
          <div>
            <button
              onClick={create} disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#2563E8", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              <Check size={14} /> {saving ? "Speichern…" : "Erstellen"}
            </button>
          </div>
        </div>
      )}

      {/* Leerlauf */}
      {items.length === 0 && (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 60, textAlign: "center" }}>
          <Megaphone size={32} style={{ color: "#1E3050", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: "#7A8BA6", margin: 0 }}>Noch keine Ankündigungen vorhanden.</p>
        </div>
      )}

      {/* Karten */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }} onClick={() => setMenuOpen(null)}>
        {items.map((a) => {
          const { icon, bg, color } = getIcon(a.title);
          const neu = isNew(a.createdAt);
          return (
            <div
              key={a.id}
              style={{
                background: "#111C2D",
                border: `1px solid ${a.pinned ? "#2563E840" : "#1A2A3D"}`,
                borderRadius: 12,
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                gap: 18,
              }}
            >
              {/* Icon-Box */}
              <div style={{
                width: 68, height: 68, borderRadius: 14, flexShrink: 0,
                background: bg, display: "flex", alignItems: "center", justifyContent: "center",
                color, boxShadow: `0 4px 20px ${color}22`,
              }}>
                {icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#EDF2F7" }}>{a.title}</span>
                  {neu && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: ".1em",
                      padding: "2px 7px", borderRadius: 99,
                      background: "rgba(37,99,232,0.2)", border: "1px solid rgba(37,99,232,0.4)",
                      color: "#60A5FA",
                    }}>NEU</span>
                  )}
                  {a.audience !== "all" && (
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 99,
                      background: "#1A2640", color: "#7A8BA6", border: "1px solid #1E3050",
                    }}>{a.audience}</span>
                  )}
                  <span style={{ fontSize: 11, color: "#4A5B6F", marginLeft: "auto", whiteSpace: "nowrap" }}>
                    {fmt(a.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#8FA3BE", margin: 0, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                  {a.content}
                </p>
              </div>

              {/* Actions */}
              {(canUpdate || canDelete) && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, position: "relative" }}>
                  {canUpdate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(a.id, a.pinned); }}
                      title={a.pinned ? "Nicht mehr anheften" : "Anheften"}
                      style={{ background: "none", border: "none", cursor: "pointer", color: a.pinned ? "#2563E8" : "#4A5B6F", padding: 6, display: "flex", borderRadius: 6 }}
                    >
                      {a.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                    </button>
                  )}
                  {canDelete && (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === a.id ? null : a.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#4A5B6F", padding: 6, display: "flex", borderRadius: 6 }}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {menuOpen === a.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50,
                            background: "#0D1829", border: "1px solid #1E3050", borderRadius: 8,
                            padding: 4, minWidth: 130, boxShadow: "0 8px 24px #00000060",
                          }}
                        >
                          <button
                            onClick={() => remove(a.id)}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "none", border: "none", color: "#F87171", fontSize: 12, cursor: "pointer", borderRadius: 6, textAlign: "left" }}
                          >
                            <Trash2 size={13} /> Löschen
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#4A5B6F", fontSize: 12, paddingTop: 4 }}>
          <Info size={13} />
          {items.length} Ankündigung{items.length !== 1 ? "en" : ""} insgesamt
        </div>
      )}
    </div>
  );
}
