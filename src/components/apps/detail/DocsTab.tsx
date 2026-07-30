"use client";

import { useState, useCallback, useEffect } from "react";
import { BookOpen, HelpCircle, Code2, FileText, Plus, Pencil, Trash2, X, Save, Eye, EyeOff, ChevronRight } from "lucide-react";
import { marked } from "marked";

type DocPageType = "MANUAL" | "FAQ" | "API" | "OTHER";

type DocPage = {
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
  MANUAL:  { label: "Handbuch",     icon: <BookOpen size={13} />, color: "#3B82F6" },
  FAQ:     { label: "FAQ",          icon: <HelpCircle size={13} />, color: "#10B981" },
  API:     { label: "API-Referenz", icon: <Code2 size={13} />,     color: "#F59E0B" },
  OTHER:   { label: "Sonstiges",    icon: <FileText size={13} />,   color: "#7A8BA6" },
};

const TYPES: DocPageType[] = ["MANUAL", "FAQ", "API", "OTHER"];

interface Props {
  appSlug: string;
  initial: DocPage[];
}

function renderMarkdown(md: string): string {
  try {
    const result = marked.parse(md, { async: false });
    return typeof result === "string" ? result : "";
  } catch {
    return md;
  }
}

export function DocsTab({ appSlug, initial }: Props) {
  const [docs, setDocs] = useState<DocPage[]>(initial);
  const [selected, setSelected] = useState<DocPage | null>(initial[0] ?? null);
  const [mode, setMode] = useState<"view" | "edit" | "new">("view");
  const [preview, setPreview] = useState(false);

  const [form, setForm] = useState({ title: "", content: "", type: "MANUAL" as DocPageType, isPublic: false });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byType = TYPES.map((t) => ({
    type: t,
    docs: docs.filter((d) => d.type === t),
  })).filter((g) => g.docs.length > 0 || mode === "new");

  function startNew() {
    setForm({ title: "", content: "", type: "MANUAL", isPublic: false });
    setSelected(null);
    setMode("new");
    setPreview(false);
    setError(null);
  }

  function startEdit(doc: DocPage) {
    setForm({ title: doc.title, content: doc.content, type: doc.type, isPublic: doc.isPublic });
    setSelected(doc);
    setMode("edit");
    setPreview(false);
    setError(null);
  }

  function cancelEdit() {
    setMode("view");
    setPreview(false);
    setError(null);
  }

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      if (mode === "new") {
        const res = await fetch(`/api/apps/${appSlug}/docs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Fehler");
        const created: DocPage = await res.json();
        setDocs((prev) => [...prev, created]);
        setSelected(created);
        setMode("view");
      } else if (mode === "edit" && selected) {
        const res = await fetch(`/api/apps/${appSlug}/docs/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Fehler");
        const updated: DocPage = await res.json();
        setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        setSelected(updated);
        setMode("view");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  }, [appSlug, form, mode, selected]);

  const deleteDoc = useCallback(async (doc: DocPage) => {
    if (!confirm(`"${doc.title}" wirklich löschen?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/apps/${appSlug}/docs/${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
      const remaining = docs.filter((d) => d.id !== doc.id);
      setDocs(remaining);
      setSelected(remaining[0] ?? null);
      setMode("view");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setDeleting(false);
    }
  }, [appSlug, docs]);

  // Keyboard shortcut: Ctrl+S zum Speichern
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
    <div style={{ display: "flex", gap: 16, minHeight: 500 }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: "#0D1829", border: "1px solid #1E3050", borderRadius: 10,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #1E3050", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#7A8BA6" }}>Dokumente</span>
          <button
            onClick={startNew}
            title="Neues Dokument"
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "rgba(37,99,232,0.15)", border: "1px solid rgba(37,99,232,0.3)", color: "#2563E8", fontSize: 11, cursor: "pointer" }}
          >
            <Plus size={11} /> Neu
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {docs.length === 0 && mode !== "new" && (
            <p style={{ fontSize: 12, color: "#7A8BA6", padding: "12px 14px", margin: 0 }}>
              Noch keine Dokumente.
            </p>
          )}

          {TYPES.map((type) => {
            const group = docs.filter((d) => d.type === type);
            if (group.length === 0) return null;
            const meta = TYPE_META[type];
            return (
              <div key={type}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px 3px", color: meta.color, fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>
                  {meta.icon}
                  {meta.label}
                </div>
                {group.map((doc) => {
                  const active = selected?.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => { setSelected(doc); setMode("view"); setError(null); }}
                      style={{
                        width: "100%", textAlign: "left",
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 14px", fontSize: 12,
                        background: active ? "rgba(37,99,232,0.12)" : "transparent",
                        color: active ? "#EDF2F7" : "#8FA3BE",
                        border: "none", cursor: "pointer",
                        borderLeft: `2px solid ${active ? "#2563E8" : "transparent"}`,
                      }}
                    >
                      <ChevronRight size={10} style={{ opacity: active ? 1 : 0, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {mode === "new" && (
            <div style={{ padding: "6px 14px" }}>
              <div style={{ fontSize: 11, color: "#2563E8", fontStyle: "italic" }}>+ Neues Dokument…</div>
            </div>
          )}
        </nav>
      </aside>

      {/* Hauptbereich */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Kein Dokument */}
        {!selected && mode !== "new" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#7A8BA6", paddingTop: 60 }}>
            <BookOpen size={36} style={{ opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Kein Dokument ausgewählt</p>
            <button onClick={startNew} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(37,99,232,0.12)", border: "1px solid rgba(37,99,232,0.3)", color: "#2563E8", fontSize: 13, cursor: "pointer" }}>
              <Plus size={14} /> Erstes Dokument erstellen
            </button>
          </div>
        )}

        {/* Ansicht */}
        {selected && mode === "view" && (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #1E3050", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: TYPE_META[selected.type].color }}>
                  {TYPE_META[selected.type].icon}
                  {TYPE_META[selected.type].label}
                </span>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#EDF2F7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selected.title}
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => startEdit(selected)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: "#1A2640", border: "1px solid #1E3050", color: "#EDF2F7", fontSize: 12, cursor: "pointer" }}
                >
                  <Pencil size={11} /> Bearbeiten
                </button>
                <button
                  onClick={() => deleteDoc(selected)}
                  disabled={deleting}
                  style={{ display: "flex", alignItems: "center", padding: "5px 10px", borderRadius: 7, background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 12, cursor: "pointer" }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>

            {/* Markdown-Inhalt */}
            <div style={{ padding: "20px 24px", minHeight: 200 }}>
              {selected.content ? (
                <div
                  className="doc-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.content) }}
                />
              ) : (
                <p style={{ color: "#7A8BA6", fontSize: 13, fontStyle: "italic" }}>Noch kein Inhalt. Klicke auf "Bearbeiten" um Text hinzuzufügen.</p>
              )}
            </div>

            <div style={{ padding: "10px 18px", borderTop: "1px solid #1E3050", display: "flex", gap: 12, fontSize: 10, color: "#7A8BA6" }}>
              {selected.createdBy && <span>Erstellt von {selected.createdBy.name}</span>}
              <span>Geändert: {new Date(selected.updatedAt).toLocaleString("de-DE")}</span>
              {selected.isPublic && <span style={{ color: "#10B981" }}>Öffentlich</span>}
            </div>
          </div>
        )}

        {/* Editor (neu oder bearbeiten) */}
        {(mode === "edit" || mode === "new") && (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 10, overflow: "hidden" }}>
            {/* Editor-Header */}
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #1E3050", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Titel…"
                style={{ flex: 1, minWidth: 160, background: "#0D1829", border: "1px solid #1E3050", borderRadius: 7, padding: "6px 12px", fontSize: 14, fontWeight: 600, color: "#EDF2F7", outline: "none" }}
              />
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DocPageType }))}
                style={{ background: "#0D1829", border: "1px solid #1E3050", borderRadius: 7, padding: "6px 10px", fontSize: 12, color: "#EDF2F7", cursor: "pointer" }}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_META[t].label}</option>
                ))}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7A8BA6", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                />
                Öffentlich
              </label>
              <button
                onClick={() => setPreview((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: preview ? "rgba(37,99,232,0.15)" : "#0D1829", border: `1px solid ${preview ? "rgba(37,99,232,0.4)" : "#1E3050"}`, color: preview ? "#2563E8" : "#7A8BA6", fontSize: 12, cursor: "pointer" }}
              >
                {preview ? <EyeOff size={12} /> : <Eye size={12} />}
                Vorschau
              </button>
            </div>

            {/* Split: Textarea + Vorschau */}
            <div style={{ display: "flex", minHeight: 360 }}>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Markdown eingeben…&#10;&#10;# Überschrift&#10;## Abschnitt&#10;**Fett**, *kursiv*, `Code`&#10;- Liste"
                style={{
                  flex: preview ? "0 0 50%" : "1",
                  resize: "none", background: "#0B1220",
                  border: "none", borderRight: preview ? "1px solid #1E3050" : "none",
                  padding: "16px 20px", fontSize: 13, color: "#EDF2F7",
                  fontFamily: "monospace", lineHeight: 1.7, outline: "none",
                }}
              />
              {preview && (
                <div
                  className="doc-content"
                  style={{ flex: "0 0 50%", padding: "16px 20px", overflowY: "auto" }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) || "<p style='color:#7A8BA6;font-style:italic'>Vorschau…</p>" }}
                />
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "10px 16px", borderTop: "1px solid #1E3050", display: "flex", alignItems: "center", gap: 8 }}>
              {error && <span style={{ flex: 1, fontSize: 12, color: "#F87171" }}>{error}</span>}
              {!error && <span style={{ flex: 1, fontSize: 11, color: "#7A8BA6" }}>Strg+S zum Speichern</span>}
              <button
                onClick={cancelEdit}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, background: "transparent", border: "1px solid #1E3050", color: "#7A8BA6", fontSize: 12, cursor: "pointer" }}
              >
                <X size={11} /> Abbrechen
              </button>
              <button
                onClick={save}
                disabled={saving || !form.title.trim()}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 16px", borderRadius: 7, background: "#2563E8", border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving || !form.title.trim() ? 0.6 : 1 }}
              >
                <Save size={11} /> {saving ? "Speichern…" : "Speichern"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .doc-content { color: #C8D8E8; font-size: 14px; line-height: 1.75; }
        .doc-content h1, .doc-content h2, .doc-content h3, .doc-content h4 { color: #EDF2F7; font-weight: 700; margin: 1.4em 0 0.6em; }
        .doc-content h1 { font-size: 22px; border-bottom: 1px solid #1E3050; padding-bottom: 8px; }
        .doc-content h2 { font-size: 18px; }
        .doc-content h3 { font-size: 15px; }
        .doc-content p { margin: 0 0 1em; }
        .doc-content ul, .doc-content ol { padding-left: 1.5em; margin: 0 0 1em; }
        .doc-content li { margin: 0.25em 0; }
        .doc-content code { background: #0B1220; border: 1px solid #1E3050; border-radius: 4px; padding: 1px 6px; font-family: monospace; font-size: 12px; color: #7DD3FC; }
        .doc-content pre { background: #0B1220; border: 1px solid #1E3050; border-radius: 8px; padding: 14px 16px; overflow-x: auto; margin: 0 0 1em; }
        .doc-content pre code { background: none; border: none; padding: 0; }
        .doc-content blockquote { border-left: 3px solid #2563E8; margin: 0 0 1em; padding: 4px 0 4px 14px; color: #7A8BA6; }
        .doc-content a { color: #2563E8; text-decoration: none; }
        .doc-content a:hover { text-decoration: underline; }
        .doc-content table { border-collapse: collapse; width: 100%; margin: 0 0 1em; }
        .doc-content th, .doc-content td { border: 1px solid #1E3050; padding: 6px 12px; }
        .doc-content th { background: #0D1829; font-weight: 600; color: #EDF2F7; }
        .doc-content hr { border: none; border-top: 1px solid #1E3050; margin: 1.5em 0; }
      `}</style>
    </div>
  );
}
