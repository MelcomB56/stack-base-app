"use client";

import { useState, useCallback } from "react";
import { Cpu, Globe, Plus, Pencil, Trash2, X, Check, Loader2, AlertCircle } from "lucide-react";

type Technology = {
  id: string;
  name: string;
  slug: string;
  category: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  _count: { apps: number };
};

const CATEGORIES = [
  { value: "LANGUAGE",       label: "Sprache" },
  { value: "FRONTEND",       label: "Frontend" },
  { value: "BACKEND",        label: "Backend" },
  { value: "DATABASE",       label: "Datenbank" },
  { value: "INFRASTRUCTURE", label: "Infrastruktur" },
  { value: "TOOL",           label: "Tool" },
  { value: "OTHER",          label: "Sonstige" },
];

const CATEGORY_ORDER = ["LANGUAGE", "FRONTEND", "BACKEND", "DATABASE", "INFRASTRUCTURE", "TOOL", "OTHER"];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

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

function DSSelect({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>{label}</label>}
      <select
        {...props}
        style={{ padding: "9px 12px", background: "#1A2640", border: `1px solid ${focused ? "#2563E8" : "#1E3050"}`, borderRadius: 8, color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color 150ms", width: "100%", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8BA6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 32, ...props.style }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Technologie-Modal ──────────────────────────────────────────────────────

interface TechModalProps {
  editing: Technology | null;
  onClose: () => void;
  onSave: (data: { name: string; category: string; logoUrl: string; websiteUrl: string }) => Promise<void>;
}

function TechModal({ editing, onClose, onSave }: TechModalProps) {
  const [name, setName]           = useState(editing?.name ?? "");
  const [category, setCategory]   = useState(editing?.category ?? "OTHER");
  const [logoUrl, setLogoUrl]     = useState(editing?.logoUrl ?? "");
  const [websiteUrl, setWebsite]  = useState(editing?.websiteUrl ?? "");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try { await onSave({ name, category, logoUrl, websiteUrl }); }
    catch (err) { setError(err instanceof Error ? err.message : "Fehler"); setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14, padding: 24, width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>{editing ? "Technologie bearbeiten" : "Neue Technologie"}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#7A8BA6", padding: 4, display: "flex", borderRadius: 6 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EDF2F7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A8BA6"; }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <DSInput label="Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. React" required maxLength={100} />
            <DSSelect label="Kategorie" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </DSSelect>
          </div>
          <DSInput label="Logo-URL (optional)" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." type="url" />
          <DSInput label="Website (optional)" value={websiteUrl} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." type="url" />

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

function DeleteDialog({ tech, onClose, onConfirm }: { tech: Technology; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = tech._count.apps > 0;

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
            <p style={{ fontSize: 14, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>Technologie löschen?</p>
            <p style={{ fontSize: 12, color: "#7A8BA6", margin: "3px 0 0" }}>„{tech.name}" wird dauerhaft entfernt.</p>
          </div>
        </div>
        {blocked && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", fontSize: 12, color: "#FCD34D" }}>
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            Wird von {tech._count.apps} App(s) verwendet — kann nicht gelöscht werden.
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

export function TechnologiesManager({ initial }: { initial: Technology[] }) {
  const [technologies, setTechnologies] = useState<Technology[]>(initial);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState<Technology | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Technology | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/technologies");
    if (res.ok) setTechnologies(await res.json());
  }, []);

  function openCreate() { setEditTarget(null); setModalOpen(true); }
  function openEdit(t: Technology) { setEditTarget(t); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditTarget(null); }

  async function handleSave(data: { name: string; category: string; logoUrl: string; websiteUrl: string }) {
    const url    = editTarget ? `/api/technologies/${editTarget.id}` : "/api/technologies";
    const method = editTarget ? "PATCH" : "POST";
    const body   = { ...data, logoUrl: data.logoUrl || undefined, websiteUrl: data.websiteUrl || undefined };
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: "Fehler" })); throw new Error(err.error ?? "Fehler"); }
    await refresh();
    closeModal();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/technologies/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: "Fehler" })); throw new Error(err.error ?? "Fehler"); }
    await refresh();
    setDeleteTarget(null);
  }

  const grouped = CATEGORY_ORDER.reduce<Record<string, Technology[]>>((acc, cat) => {
    const items = technologies.filter((t) => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Cpu size={18} style={{ color: "#2563E8" }} />
              Technologien
            </h1>
            <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>
              {technologies.length} Technologie{technologies.length !== 1 ? "n" : ""} im Einsatz
            </p>
          </div>
          <button onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#2563E8", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer" }}>
            <Plus size={14} />
            Neue Technologie
          </button>
        </div>

        {/* Leer-Zustand */}
        {technologies.length === 0 ? (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#7A8BA6", marginBottom: 14 }}>Noch keine Technologien angelegt.</p>
            <button onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#1A2640", color: "#EDF2F7", borderRadius: 8, fontSize: 13, border: "1px solid #1E3050", cursor: "pointer" }}>
              <Plus size={13} />Erste Technologie anlegen
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <section key={cat} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0 }}>
                {CATEGORY_LABEL[cat] ?? cat}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                {items.map((tech) => (
                  <div
                    key={tech.id}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#111C2D", border: "1px solid #1E3050", borderRadius: 8, transition: "border-color 150ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,232,0.3)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1E3050"; }}
                  >
                    {tech.logoUrl ? (
                      <img src={tech.logoUrl} alt={tech.name} style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} />
                    ) : (
                      <Globe size={14} style={{ color: "#7A8BA6", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "#EDF2F7", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tech.name}</p>
                      <p style={{ fontSize: 10, color: "#7A8BA6", margin: "1px 0 0", fontVariantNumeric: "tabular-nums" }}>{tech._count.apps} Apps</p>
                    </div>
                    <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                      <button onClick={() => openEdit(tech)} title="Bearbeiten"
                        style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 5, cursor: "pointer", color: "#7A8BA6" }}
                        onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#EDF2F7"; b.style.borderColor = "#2563E8"; }}
                        onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#7A8BA6"; b.style.borderColor = "#1E3050"; }}>
                        <Pencil size={10} />
                      </button>
                      <button onClick={() => setDeleteTarget(tech)} title="Löschen"
                        style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 5, cursor: "pointer", color: "#7A8BA6" }}
                        onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#EF4444"; b.style.borderColor = "rgba(239,68,68,0.4)"; }}
                        onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#7A8BA6"; b.style.borderColor = "#1E3050"; }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {modalOpen && <TechModal editing={editTarget} onClose={closeModal} onSave={handleSave} />}
      {deleteTarget && <DeleteDialog tech={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
    </>
  );
}
