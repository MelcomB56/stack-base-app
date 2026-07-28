"use client";

import { useState, useCallback, useEffect } from "react";
import { Layers, Cpu, Plus, Pencil, Trash2, X, Check, Loader2, AlertCircle, Search } from "lucide-react";

type Technology = {
  id: string;
  name: string;
  slug: string;
  category: string;
};

type Stack = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  technologies: { technology: Technology }[];
  _count: { apps: number };
};

const CATEGORY_LABEL: Record<string, string> = {
  LANGUAGE:       "Sprache",
  FRONTEND:       "Frontend",
  BACKEND:        "Backend",
  DATABASE:       "Datenbank",
  INFRASTRUCTURE: "Infrastruktur",
  TOOL:           "Tool",
  OTHER:          "Sonstige",
};
const CATEGORY_ORDER = ["LANGUAGE", "FRONTEND", "BACKEND", "DATABASE", "INFRASTRUCTURE", "TOOL", "OTHER"];

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

function DSTextarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>{label}</label>}
      <textarea
        {...props}
        style={{ padding: "9px 12px", background: "#1A2640", border: `1px solid ${focused ? "#2563E8" : "#1E3050"}`, borderRadius: 8, color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color 150ms", width: "100%", resize: "vertical", minHeight: 72, ...props.style }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      />
    </div>
  );
}

// ─── Stack-Modal ────────────────────────────────────────────────────────────

interface StackModalProps {
  editing: Stack | null;
  onClose: () => void;
  onSave: (data: { name: string; description: string; technologyIds: string[] }) => Promise<void>;
}

function StackModal({ editing, onClose, onSave }: StackModalProps) {
  const [name, setName]               = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    editing?.technologies.map((t) => t.technology.id) ?? []
  );
  const [allTechs, setAllTechs]       = useState<Technology[]>([]);
  const [techSearch, setTechSearch]   = useState("");
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Fetch technologies on mount
  useEffect(() => {
    fetch("/api/technologies")
      .then((r) => r.json())
      .then((data: Technology[]) => { setAllTechs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function toggleTech(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const filteredGroups = CATEGORY_ORDER.reduce<Record<string, Technology[]>>((acc, cat) => {
    const items = allTechs.filter(
      (t) =>
        t.category === cat &&
        (techSearch === "" || t.name.toLowerCase().includes(techSearch.toLowerCase()))
    );
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length === 0) { setError("Mindestens eine Technologie auswählen."); return; }
    setSaving(true);
    setError(null);
    try { await onSave({ name, description, technologyIds: selectedIds }); }
    catch (err) { setError(err instanceof Error ? err.message : "Fehler"); setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14, padding: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column", gap: 20, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>{editing ? "Stack bearbeiten" : "Neuer Stack"}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#7A8BA6", padding: 4, display: "flex", borderRadius: 6 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EDF2F7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A8BA6"; }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "hidden", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flexShrink: 0 }}>
            <DSInput label="Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Full-Stack Web" required maxLength={100} />
            <DSTextarea label="Beschreibung (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kurze Beschreibung des Stacks..." maxLength={255} />
          </div>

          {/* Technology Multi-Select */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
                Technologien * ({selectedIds.length} gewählt)
              </label>
            </div>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#7A8BA6", pointerEvents: "none" }} />
              <input
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                placeholder="Suchen..."
                style={{ width: "100%", padding: "7px 10px 7px 28px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, color: "#EDF2F7", fontSize: 12, outline: "none", fontFamily: "inherit" }}
              />
            </div>
            <div style={{ overflow: "auto", flex: 1, minHeight: 160, maxHeight: 240, border: "1px solid #1E3050", borderRadius: 8, padding: "8px 4px" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80 }}>
                  <Loader2 size={16} style={{ color: "#7A8BA6" }} className="animate-spin" />
                </div>
              ) : Object.keys(filteredGroups).length === 0 ? (
                <p style={{ fontSize: 12, color: "#7A8BA6", textAlign: "center", marginTop: 24 }}>Keine Treffer.</p>
              ) : (
                Object.entries(filteredGroups).map(([cat, items]) => (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 4px 8px" }}>
                      {CATEGORY_LABEL[cat] ?? cat}
                    </p>
                    {items.map((tech) => {
                      const checked = selectedIds.includes(tech.id);
                      return (
                        <button
                          key={tech.id}
                          type="button"
                          onClick={() => toggleTech(tech.id)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: checked ? "rgba(37,99,232,0.12)" : "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background 100ms" }}
                          onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "#1A2640"; }}
                          onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        >
                          <div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${checked ? "#2563E8" : "#1E3050"}`, background: checked ? "#2563E8" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 100ms" }}>
                            {checked && <Check size={9} style={{ color: "#fff" }} />}
                          </div>
                          <span style={{ fontSize: 12, color: checked ? "#EDF2F7" : "#7A8BA6", transition: "color 100ms" }}>{tech.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#F87171", flexShrink: 0 }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />{error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0, paddingTop: 4 }}>
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

function DeleteDialog({ stack, onClose, onConfirm }: { stack: Stack; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = stack._count.apps > 0;

  async function handle() {
    setDeleting(true);
    setError(null);
    try { await onConfirm(); }
    catch (err) { setError(err instanceof Error ? err.message : "Fehler"); setDeleting(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14, padding: 24, width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trash2 size={16} style={{ color: "#EF4444" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>Stack löschen?</p>
            <p style={{ fontSize: 12, color: "#7A8BA6", margin: "3px 0 0" }}>„{stack.name}" wird dauerhaft entfernt.</p>
          </div>
        </div>
        {blocked && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", fontSize: 12, color: "#FCD34D" }}>
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            Wird von {stack._count.apps} App(s) verwendet — kann nicht gelöscht werden.
          </div>
        )}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#F87171" }}>
            <AlertCircle size={13} style={{ flexShrink: 0 }} />{error}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "transparent", color: "#7A8BA6", border: "1px solid #1E3050", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Abbrechen</button>
          <button onClick={handle} disabled={deleting || blocked} style={{ padding: "8px 18px", background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: deleting || blocked ? "not-allowed" : "pointer", opacity: deleting || blocked ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}>
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Haupt-Komponente ───────────────────────────────────────────────────────

export function StacksManager({ initial }: { initial: Stack[] }) {
  const [stacks, setStacks]           = useState<Stack[]>(initial);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState<Stack | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Stack | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/stacks");
    if (res.ok) setStacks(await res.json());
  }, []);

  function openCreate() { setEditTarget(null); setModalOpen(true); }
  function openEdit(s: Stack) { setEditTarget(s); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditTarget(null); }

  async function handleSave(data: { name: string; description: string; technologyIds: string[] }) {
    const url    = editTarget ? `/api/stacks/${editTarget.id}` : "/api/stacks";
    const method = editTarget ? "PATCH" : "POST";
    const body   = { name: data.name, description: data.description || undefined, technologyIds: data.technologyIds };
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: "Fehler" })); throw new Error(err.error ?? "Fehler"); }
    await refresh();
    closeModal();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/stacks/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: "Fehler" })); throw new Error(err.error ?? "Fehler"); }
    await refresh();
    setDeleteTarget(null);
  }

  return (
    <>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={18} style={{ color: "#2563E8" }} />
              Stacks
            </h1>
            <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>
              {stacks.length} Tech-Stack{stacks.length !== 1 ? "s" : ""} definiert
            </p>
          </div>
          <button onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#2563E8", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer" }}>
            <Plus size={14} />
            Neuer Stack
          </button>
        </div>

        {/* Leer-Zustand */}
        {stacks.length === 0 ? (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#7A8BA6", marginBottom: 14 }}>Noch keine Stacks angelegt.</p>
            <button onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#1A2640", color: "#EDF2F7", borderRadius: 8, fontSize: 13, border: "1px solid #1E3050", cursor: "pointer" }}>
              <Plus size={13} />Ersten Stack anlegen
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {stacks.map((stack) => (
              <div
                key={stack.id}
                style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12, transition: "border-color 150ms" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,232,0.3)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1E3050"; }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(37,99,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Layers size={15} style={{ color: "#2563E8" }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stack.name}</p>
                      {stack.description && (
                        <p style={{ fontSize: 11, color: "#7A8BA6", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {stack.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: "#7A8BA6", paddingRight: 6, whiteSpace: "nowrap" }}>{stack._count.apps} Apps</span>
                    <button onClick={() => openEdit(stack)} title="Bearbeiten"
                      style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 5, cursor: "pointer", color: "#7A8BA6" }}
                      onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#EDF2F7"; b.style.borderColor = "#2563E8"; }}
                      onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#7A8BA6"; b.style.borderColor = "#1E3050"; }}>
                      <Pencil size={11} />
                    </button>
                    <button onClick={() => setDeleteTarget(stack)} title="Löschen"
                      style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 5, cursor: "pointer", color: "#7A8BA6" }}
                      onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#EF4444"; b.style.borderColor = "rgba(239,68,68,0.4)"; }}
                      onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#7A8BA6"; b.style.borderColor = "#1E3050"; }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {stack.technologies.length > 0 && (
                  <div style={{ borderTop: "1px solid #1E3050", paddingTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {stack.technologies.slice(0, 6).map(({ technology }) => (
                      <span key={technology.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: "#1A2640", fontSize: 10, color: "#7A8BA6" }}>
                        <Cpu size={9} />{technology.name}
                      </span>
                    ))}
                    {stack.technologies.length > 6 && (
                      <span style={{ padding: "2px 8px", borderRadius: 4, background: "#1A2640", fontSize: 10, color: "#7A8BA6" }}>
                        +{stack.technologies.length - 6}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && <StackModal editing={editTarget} onClose={closeModal} onSave={handleSave} />}
      {deleteTarget && <DeleteDialog stack={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
    </>
  );
}
