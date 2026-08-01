"use client";

import { useState, useCallback, useEffect } from "react";
import { BookOpen, HelpCircle, Code2, FileText, Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { marked } from "marked";

type DocPageType = "MANUAL" | "FAQ" | "API" | "OTHER";

type Doc = {
  id: string;
  title: string;
  slug: string;
  content: string;
  type: DocPageType;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string } | null;
};

const TYPE_META: Record<DocPageType, { label: string; icon: React.ReactNode; color: string }> = {
  MANUAL:  { label: "Handbuch",     icon: <BookOpen size={13} />,   color: "#3B82F6" },
  FAQ:     { label: "FAQ",          icon: <HelpCircle size={13} />, color: "#10B981" },
  API:     { label: "API-Referenz", icon: <Code2 size={13} />,      color: "#F59E0B" },
  OTHER:   { label: "Sonstiges",    icon: <FileText size={13} />,   color: "#7A8BA6" },
};

const TYPES: DocPageType[] = ["MANUAL", "FAQ", "API", "OTHER"];

function renderContent(content: string): string {
  if (content.trimStart().startsWith("<")) return content;
  try {
    const r = marked.parse(content, { async: false });
    return typeof r === "string" ? r : "";
  } catch { return content; }
}

interface Props { initial: Doc[] }

export function PlatformDocsPage({ initial }: Props) {
  const [docs, setDocs] = useState<Doc[]>(initial);
  const [selected, setSelected] = useState<Doc | null>(initial[0] ?? null);
  const [mode, setMode] = useState<"view" | "edit" | "new">("view");

  useEffect(() => {
    if (initial.length > 0) return;
    fetch("/api/platform-docs")
      .then((r) => r.json())
      .then((d: Doc[]) => { if (d.length > 0) { setDocs(d); setSelected(d[0]); } })
      .catch(() => {});
  }, [initial.length]);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "MANUAL" as DocPageType, isPublic: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setForm({ title: "", content: "", type: "MANUAL", isPublic: false });
    setSelected(null);
    setMode("new");
    setPreview(false);
    setError(null);
  }

  function startEdit(doc: Doc) {
    setForm({ title: doc.title, content: doc.content, type: doc.type, isPublic: doc.isPublic });
    setSelected(doc);
    setMode("edit");
    setPreview(false);
    setError(null);
  }

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      if (mode === "new") {
        const res = await fetch("/api/platform-docs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Fehler");
        const created: Doc = await res.json();
        setDocs((p) => [...p, created]);
        setSelected(created);
        setMode("view");
      } else if (mode === "edit" && selected) {
        const res = await fetch(`/api/platform-docs/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Fehler");
        const updated: Doc = await res.json();
        setDocs((p) => p.map((d) => (d.id === updated.id ? updated : d)));
        setSelected(updated);
        setMode("view");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  }, [form, mode, selected]);

  const deleteDoc = useCallback(async (doc: Doc) => {
    if (!confirm(`"${doc.title}" wirklich löschen?`)) return;
    try {
      const res = await fetch(`/api/platform-docs/${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
      const remaining = docs.filter((d) => d.id !== doc.id);
      setDocs(remaining);
      setSelected(remaining[0] ?? null);
      setMode("view");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
  }, [docs]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && (mode === "edit" || mode === "new")) {
        e.preventDefault();
        save();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode, save]);

  return (
    <div style={{ display: "flex", gap: 16, minHeight: "calc(100vh - 120px)" }}>

      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: "#0D1829", border: "1px solid #1E3050", borderRadius: 10,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #1E3050", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#7A8BA6" }}>Dokumente</span>
          <button onClick={startNew} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "rgba(37,99,232,0.15)", border: "1px solid rgba(37,99,232,0.3)", color: "#2563E8", fontSize: 12, cursor: "pointer" }}>
            <Plus size={12} /> Neu
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {docs.length === 0 && mode !== "new" && (
            <p style={{ fontSize: 13, color: "#7A8BA6", padding: "16px", margin: 0 }}>Keine Dokumente vorhanden.</p>
          )}
          {TYPES.map((type) => {
            const group = docs.filter((d) => d.type === type);
            if (group.length === 0) return null;
            const meta = TYPE_META[type];
            return (
              <div key={type}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px 3px", color: meta.color, fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>
                  {meta.icon} {meta.label}
                </div>
                {group.map((doc) => {
                  const active = selected?.id === doc.id;
                  return (
                    <button key={doc.id} onClick={() => { setSelected(doc); setMode("view"); setError(null); }}
                      style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", fontSize: 13, background: active ? "rgba(37,99,232,0.12)" : "transparent", color: active ? "#EDF2F7" : "#8FA3BE", border: "none", cursor: "pointer", borderLeft: `2px solid ${active ? "#2563E8" : "transparent"}` }}>
                      <ChevronRight size={10} style={{ opacity: active ? 1 : 0, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
          {mode === "new" && (
            <div style={{ padding: "7px 14px", fontSize: 12, color: "#2563E8", fontStyle: "italic" }}>+ Neues Dokument…</div>
          )}
        </nav>
      </aside>

      {/* Hauptbereich */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {!selected && mode !== "new" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 12, color: "#7A8BA6" }}>
            <BookOpen size={40} style={{ opacity: 0.25 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Kein Dokument ausgewählt</p>
            <button onClick={startNew} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(37,99,232,0.12)", border: "1px solid rgba(37,99,232,0.3)", color: "#2563E8", fontSize: 13, cursor: "pointer" }}>
              <Plus size={14} /> Erstes Dokument erstellen
            </button>
          </div>
        )}

        {/* Ansicht */}
        {selected && mode === "view" && (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #1E3050", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: TYPE_META[selected.type].color, flexShrink: 0 }}>
                  {TYPE_META[selected.type].icon} {TYPE_META[selected.type].label}
                </span>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#EDF2F7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selected.title}
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => startEdit(selected)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: "#1A2640", border: "1px solid #1E3050", color: "#EDF2F7", fontSize: 12, cursor: "pointer" }}>
                  <Pencil size={11} /> Bearbeiten
                </button>
                <button onClick={() => deleteDoc(selected)} style={{ display: "flex", alignItems: "center", padding: "5px 10px", borderRadius: 7, background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 12, cursor: "pointer" }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
            <div style={{ padding: "24px 28px", minHeight: 300 }}>
              {selected.content ? (
                <div className="doc-content" dangerouslySetInnerHTML={{ __html: renderContent(selected.content) }} />
              ) : (
                <p style={{ color: "#7A8BA6", fontSize: 13, fontStyle: "italic" }}>Kein Inhalt. Klicke auf "Bearbeiten".</p>
              )}
            </div>
            <div style={{ padding: "10px 20px", borderTop: "1px solid #1E3050", display: "flex", gap: 16, fontSize: 11, color: "#7A8BA6" }}>
              {selected.createdBy && <span>Erstellt von {selected.createdBy.name}</span>}
              <span>Geändert: {new Date(selected.updatedAt).toLocaleString("de-DE")}</span>
            </div>
          </div>
        )}

        {/* Editor */}
        {(mode === "edit" || mode === "new") && (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E3050", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>{mode === "new" ? "Neues Dokument" : "Bearbeiten"}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPreview((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, background: preview ? "rgba(37,99,232,0.15)" : "#1A2640", border: "1px solid #1E3050", color: preview ? "#2563E8" : "#7A8BA6", fontSize: 12, cursor: "pointer" }}>
                  {preview ? "Editor" : "Vorschau"}
                </button>
                <button onClick={() => { setMode("view"); setError(null); }} style={{ padding: "5px 10px", borderRadius: 6, background: "transparent", border: "1px solid #1E3050", color: "#7A8BA6", fontSize: 12, cursor: "pointer" }}>Abbrechen</button>
                <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 6, background: "#2563E8", border: "none", color: "#fff", fontSize: 12, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Speichern…" : "Speichern"}
                </button>
              </div>
            </div>

            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {error && <div style={{ background: "#2d1a1a", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "8px 12px", color: "#F87171", fontSize: 13 }}>{error}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Titel</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    style={{ width: "100%", background: "#0B1220", border: "1px solid #1E3050", borderRadius: 6, padding: "7px 10px", color: "#EDF2F7", fontSize: 14, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Typ</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DocPageType }))}
                    style={{ background: "#0B1220", border: "1px solid #1E3050", borderRadius: 6, padding: "7px 10px", color: "#EDF2F7", fontSize: 13, cursor: "pointer" }}>
                    {TYPES.map((t) => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 2 }}>
                  <input type="checkbox" id="isPublic" checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))} />
                  <label htmlFor="isPublic" style={{ fontSize: 12, color: "#7A8BA6", cursor: "pointer" }}>Öffentlich</label>
                </div>
              </div>

              {preview ? (
                <div style={{ background: "#0B1220", border: "1px solid #1E3050", borderRadius: 6, padding: "16px 20px", minHeight: 300 }}>
                  <div className="doc-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }} />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Inhalt (Markdown)</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    rows={22}
                    placeholder="# Überschrift&#10;&#10;Text in **Markdown** …"
                    style={{ width: "100%", background: "#0B1220", border: "1px solid #1E3050", borderRadius: 6, padding: "10px 12px", color: "#EDF2F7", fontSize: 13, fontFamily: "monospace", lineHeight: 1.6, outline: "none", resize: "vertical" }}
                  />
                  <p style={{ fontSize: 11, color: "#4A5B6F", margin: "4px 0 0" }}>Strg+S zum Speichern · Markdown wird gerendert</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
