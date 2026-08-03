"use client";

import { useState } from "react";
import { Megaphone, Pin, PinOff, Trash2, Plus, X, Check } from "lucide-react";

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

const inputStyle: React.CSSProperties = {
  background: "#0B1220", border: "1px solid #1E3050", borderRadius: 6,
  padding: "8px 10px", fontSize: 13, color: "#EDF2F7", outline: "none",
  width: "100%", boxSizing: "border-box",
};

export function AnnouncementsClient({ initial }: { initial: Announcement[] }) {
  const [items, setItems]         = useState<Announcement[]>(initial);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ title: "", content: "", pinned: false, audience: "all" });
  const [error, setError]         = useState<string | null>(null);

  function setF(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  async function create() {
    if (!form.title || !form.content) { setError("Titel und Inhalt sind Pflichtfelder."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Fehler"); return; }
      const a: Announcement = await res.json();
      setItems((p) => [a, ...p].sort((x, y) => (y.pinned ? 1 : 0) - (x.pinned ? 1 : 0) || new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()));
      setForm({ title: "", content: "", pinned: false, audience: "all" });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(id: string, pinned: boolean) {
    const res = await fetch(`/api/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !pinned }),
    });
    if (res.ok) {
      const updated: Announcement = await res.json();
      setItems((p) => p.map((a) => a.id === id ? updated : a)
        .sort((x, y) => (y.pinned ? 1 : 0) - (x.pinned ? 1 : 0) || new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()));
    }
  }

  async function remove(id: string) {
    if (!confirm("Ankündigung wirklich löschen?")) return;
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((a) => a.id !== id));
  }

  const cardStyle: React.CSSProperties = {
    background: "#111C2D", border: "1px solid #1E3050", borderRadius: 10, padding: "14px 16px",
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Megaphone size={20} style={{ color: "#2563E8" }} />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>Ankündigungen</h1>
          <span style={{ fontSize: 11, background: "#1A2640", color: "#7A8BA6", padding: "2px 8px", borderRadius: 99 }}>{items.length}</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#2563E8", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, color: "#fff", cursor: "pointer" }}
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? "Abbrechen" : "Neue Ankündigung"}
        </button>
      </div>

      {/* Formular */}
      {showForm && (
        <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>Neue Ankündigung</p>
          <div>
            <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Titel *</label>
            <input style={inputStyle} placeholder="Ankündigungstitel" value={form.title} onChange={setF("title")} maxLength={200} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Inhalt *</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
              rows={4}
              placeholder="Inhalt der Ankündigung..."
              value={form.content}
              onChange={setF("content")}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Zielgruppe</label>
              <select style={{ ...inputStyle, padding: "7px 8px" }} value={form.audience} onChange={setF("audience")}>
                <option value="all">Alle</option>
                <option value="admin">Nur Admins</option>
                <option value="dev">Entwickler</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#EDF2F7" }}>
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm((p) => ({ ...p, pinned: e.target.checked }))}
                  style={{ width: 14, height: 14, accentColor: "#2563E8" }}
                />
                Oben anheften
              </label>
            </div>
          </div>
          {error && <p style={{ fontSize: 12, color: "#F87171", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={create}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#2563E8", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              <Check size={13} /> {saving ? "Speichern..." : "Erstellen"}
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {items.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: 40 }}>
          <Megaphone size={28} style={{ color: "#1E3050", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 13, color: "#7A8BA6", margin: 0 }}>Noch keine Ankündigungen vorhanden.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((a) => (
            <div key={a.id} style={{
              ...cardStyle,
              borderColor: a.pinned ? "#2563E844" : "#1E3050",
              background: a.pinned ? "#0d1929" : "#111C2D",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {a.pinned && <Pin size={11} style={{ color: "#2563E8", flexShrink: 0 }} />}
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>{a.title}</span>
                    {a.audience !== "all" && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "#1A2640", color: "#7A8BA6", border: "1px solid #1E3050" }}>
                        {a.audience}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: "#4A5B6F", marginLeft: "auto" }}>{fmt(a.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#7A8BA6", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.content}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => togglePin(a.id, a.pinned)}
                    title={a.pinned ? "Nicht mehr anheften" : "Anheften"}
                    style={{ background: "none", border: "none", cursor: "pointer", color: a.pinned ? "#2563E8" : "#4A5B6F", padding: 4, display: "flex" }}
                  >
                    {a.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    title="Löschen"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#4A5B6F", padding: 4, display: "flex" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
