"use client";

import { useState, useCallback } from "react";
import { useCan } from "@/lib/permissions-context";
import { Tag, Plus, Pencil, Trash2, X, Check, Loader2, AlertCircle } from "lucide-react";

type TagItem = {
  id: string;
  name: string;
  slug: string;
  color: string;
  _count: { apps: number };
};

const PRESET_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444",
  "#F97316", "#EAB308", "#22C55E", "#10B981",
  "#06B6D4", "#3B82F6", "#6B7280", "#14B8A6",
];

// ─── DS-Helpers ────────────────────────────────────────────────────────────

function DSInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>{label}</label>}
      <input
        {...props}
        style={{ padding: "9px 12px", background: "#1A2640", border: `1px solid ${focused ? "#2563E8" : "#1E3050"}`, borderRadius: 8, color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color 150ms", width: "100%", ...props.style }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      />
    </div>
  );
}

// ─── Tag-Modal ──────────────────────────────────────────────────────────────

function TagModal({ editing, onClose, onSave }: {
  editing: TagItem | null;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => Promise<void>;
}) {
  const [name, setName]   = useState(editing?.name ?? "");
  const [color, setColor] = useState(editing?.color ?? "#6366F1");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try { await onSave({ name, color }); }
    catch (err) { setError(err instanceof Error ? err.message : "Fehler"); setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14, padding: 24, width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>{editing ? "Tag bearbeiten" : "Neuer Tag"}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#7A8BA6", padding: 4, display: "flex", borderRadius: 6 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EDF2F7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A8BA6"; }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Vorschau */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: `${color}22`, color, border: `1px solid ${color}55`,
            }}>
              <Tag size={10} />{name || "Vorschau"}
            </span>
          </div>

          <DSInput label="Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. intern" required maxLength={50} />

          {/* Farbpalette */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>Farbe</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c} type="button" onClick={() => setColor(c)} title={c}
                  style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: color === c ? `3px solid #EDF2F7` : "3px solid transparent", cursor: "pointer", outline: "none", boxSizing: "border-box" }}
                />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: color, border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }} />
              <DSInput value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6366F1" style={{ fontFamily: "monospace", fontSize: 12 }} />
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#F87171" }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />{error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "transparent", color: "#7A8BA6", border: "1px solid #1E3050", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Abbrechen</button>
            <button type="submit" disabled={saving || !name.trim()} style={{ padding: "8px 18px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving || !name.trim() ? "not-allowed" : "pointer", opacity: saving || !name.trim() ? 0.65 : 1, display: "flex", alignItems: "center", gap: 6 }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {editing ? "Speichern" : "Erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Lösch-Dialog ──────────────────────────────────────────────────────────

function DeleteDialog({ tag, onClose, onConfirm }: { tag: TagItem; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    setDeleting(true);
    setError(null);
    try { await onConfirm(); }
    catch (err) { setError(err instanceof Error ? err.message : "Fehler"); setDeleting(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14, padding: 24, width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trash2 size={16} style={{ color: "#EF4444" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>Tag löschen?</p>
            <p style={{ fontSize: 12, color: "#7A8BA6", margin: "3px 0 0" }}>„{tag.name}" wird dauerhaft entfernt.</p>
          </div>
        </div>
        {tag._count.apps > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", fontSize: 12, color: "#FCD34D" }}>
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            Noch {tag._count.apps} App(s) mit diesem Tag — trotzdem löschen?
          </div>
        )}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#F87171" }}>
            <AlertCircle size={13} style={{ flexShrink: 0 }} />{error}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "transparent", color: "#7A8BA6", border: "1px solid #1E3050", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Abbrechen</button>
          <button onClick={handle} disabled={deleting} style={{ padding: "8px 18px", background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}>
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Haupt-Komponente ───────────────────────────────────────────────────────

export function TagsManager({ initial }: { initial: TagItem[] }) {
  const canCreate = useCan("tags.create");
  const canEdit   = useCan("tags.update");
  const canDelete = useCan("tags.delete");

  const [tags, setTags]           = useState<TagItem[]>(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget]   = useState<TagItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TagItem | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/tags");
    if (res.ok) setTags(await res.json());
  }, []);

  function openCreate() { setEditTarget(null); setModalOpen(true); }
  function openEdit(t: TagItem) { setEditTarget(t); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditTarget(null); }

  async function handleSave(data: { name: string; color: string }) {
    const url    = editTarget ? `/api/tags/${editTarget.id}` : "/api/tags";
    const method = editTarget ? "PATCH" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: "Fehler" })); throw new Error(err.error ?? "Fehler"); }
    await refresh();
    closeModal();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/tags/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: "Fehler" })); throw new Error(err.error ?? "Fehler"); }
    await refresh();
    setDeleteTarget(null);
  }

  return (
    <>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Tag size={18} style={{ color: "#2563E8" }} />
              Tags
            </h1>
            <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>
              {tags.length} Tag{tags.length !== 1 ? "s" : ""} angelegt
            </p>
          </div>
          {canCreate && (
            <button onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#2563E8", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer" }}>
              <Plus size={14} />Neuer Tag
            </button>
          )}
        </div>

        {tags.length === 0 ? (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#7A8BA6", marginBottom: 14 }}>Noch keine Tags angelegt.</p>
            {canCreate && (
              <button onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#1A2640", color: "#EDF2F7", borderRadius: 8, fontSize: 13, border: "1px solid #1E3050", cursor: "pointer" }}>
                <Plus size={13} />Ersten Tag anlegen
              </button>
            )}
          </div>
        ) : (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tags.map((tag) => (
              <div
                key={tag.id}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 6px 4px 10px", borderRadius: 20, background: `${tag.color}18`, border: `1px solid ${tag.color}44` }}
              >
                <Tag size={10} style={{ color: tag.color }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: tag.color }}>{tag.name}</span>
                <span style={{ fontSize: 10, color: "#7A8BA6", paddingLeft: 2 }}>{tag._count.apps}</span>
                <div style={{ display: "flex", gap: 2, marginLeft: 2 }}>
                  {canEdit && (
                    <button onClick={() => openEdit(tag)} title="Bearbeiten"
                      style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 4, cursor: "pointer", color: "#7A8BA6" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EDF2F7"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A8BA6"; }}>
                      <Pencil size={9} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => setDeleteTarget(tag)} title="Löschen"
                      style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 4, cursor: "pointer", color: "#7A8BA6" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A8BA6"; }}>
                      <X size={9} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && <TagModal editing={editTarget} onClose={closeModal} onSave={handleSave} />}
      {deleteTarget && <DeleteDialog tag={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
    </>
  );
}
