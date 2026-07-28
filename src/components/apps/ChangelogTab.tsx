"use client";

import { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, Loader2, AlertCircle } from "lucide-react";
import type { ReleaseItem } from "./ReleasesTab";

export type ChangelogEntry = {
  id: string;
  type: string;
  description: string;
  entryDate: string | Date;
  release: { id: string; version: string } | null;
  createdBy: { name: string | null };
};

const TYPE_OPTIONS = [
  { value: "ADDED",      label: "Neu",        color: "#34D399", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)"  },
  { value: "CHANGED",    label: "Geändert",   color: "#60A5FA", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)"  },
  { value: "FIXED",      label: "Behoben",    color: "#FBBF24", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
  { value: "REMOVED",    label: "Entfernt",   color: "#F87171", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"   },
  { value: "SECURITY",   label: "Sicherheit", color: "#C084FC", bg: "rgba(168,85,247,0.1)",  border: "rgba(168,85,247,0.25)"  },
  { value: "DEPRECATED", label: "Veraltet",   color: "#FB923C", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)"  },
];

const TYPE_STYLE: Record<string, (typeof TYPE_OPTIONS)[0]> = Object.fromEntries(
  TYPE_OPTIONS.map((o) => [o.value, o])
);

function fmt(d: Date | string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(d));
}

function toDateInput(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

// ─── DSInput / DSSelect / DSTextarea ───────────────────────────────────────

function DSInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>{label}</label>}
      <input
        {...props}
        style={{
          padding: "9px 12px", background: "#1A2640",
          border: `1px solid ${focused ? "#2563E8" : "#1E3050"}`, borderRadius: 8,
          color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit",
          transition: "border-color 150ms", width: "100%", ...props.style,
        }}
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
        style={{
          padding: "9px 12px", background: "#1A2640",
          border: `1px solid ${focused ? "#2563E8" : "#1E3050"}`, borderRadius: 8,
          color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit",
          transition: "border-color 150ms", width: "100%", appearance: "none",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8BA6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 32,
          ...props.style,
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      >
        {children}
      </select>
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
        style={{
          padding: "9px 12px", background: "#1A2640",
          border: `1px solid ${focused ? "#2563E8" : "#1E3050"}`, borderRadius: 8,
          color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit",
          transition: "border-color 150ms", width: "100%", resize: "vertical", minHeight: 80,
          ...props.style,
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      />
    </div>
  );
}

// ─── Changelog-Modal ────────────────────────────────────────────────────────

interface EntryModalProps {
  editing: ChangelogEntry | null;
  releases: ReleaseItem[];
  onClose: () => void;
  onSave: (data: { type: string; description: string; entryDate: string; releaseId: string }) => Promise<void>;
}

function EntryModal({ editing, releases, onClose, onSave }: EntryModalProps) {
  const [type, setType]             = useState(editing?.type ?? "ADDED");
  const [description, setDesc]      = useState(editing?.description ?? "");
  const [entryDate, setEntryDate]   = useState(editing ? toDateInput(editing.entryDate) : new Date().toISOString().slice(0, 10));
  const [releaseId, setReleaseId]   = useState(editing?.release?.id ?? "");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ type, description, entryDate, releaseId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14, padding: 24, width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 20, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>
            {editing ? "Eintrag bearbeiten" : "Neuer Eintrag"}
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#7A8BA6", padding: 4, display: "flex", borderRadius: 6 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EDF2F7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A8BA6"; }}>
            <X size={16} />
          </button>
        </div>

        {/* Typ-Auswahl als visuelle Chips */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
            Typ *
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TYPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setType(o.value)}
                style={{
                  padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${type === o.value ? o.border : "#1E3050"}`,
                  color: type === o.value ? o.color : "#7A8BA6",
                  background: type === o.value ? o.bg : "transparent",
                  transition: "all 150ms",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <DSTextarea
            label="Beschreibung *"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Was wurde hinzugefügt / geändert / behoben?"
            required
            maxLength={2000}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <DSInput label="Datum" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            <DSSelect label="Release (optional)" value={releaseId} onChange={(e) => setReleaseId(e.target.value)}>
              <option value="">— kein Release —</option>
              {releases.map((r) => (
                <option key={r.id} value={r.id}>v{r.version}{r.isCurrent ? " (aktuell)" : ""}</option>
              ))}
            </DSSelect>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#F87171" }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "transparent", color: "#7A8BA6", border: "1px solid #1E3050", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Abbrechen</button>
            <button type="submit" disabled={saving || !description.trim()} style={{ padding: "8px 18px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving || !description.trim() ? "not-allowed" : "pointer", opacity: saving || !description.trim() ? 0.65 : 1, display: "flex", alignItems: "center", gap: 6 }}>
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

function DeleteDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => Promise<void> }) {
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
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14, padding: 24, width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trash2 size={16} style={{ color: "#EF4444" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>Eintrag löschen?</p>
            <p style={{ fontSize: 12, color: "#7A8BA6", margin: "3px 0 0" }}>Dieser Changelog-Eintrag wird dauerhaft entfernt.</p>
          </div>
        </div>
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

export function ChangelogTab({
  appSlug,
  initial,
  releases,
}: {
  appSlug: string;
  initial: ChangelogEntry[];
  releases: ReleaseItem[];
}) {
  const [entries, setEntries]           = useState<ChangelogEntry[]>(initial);
  const [availReleases, setAvailReleases] = useState<ReleaseItem[]>(releases);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState<ChangelogEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChangelogEntry | null>(null);

  const refresh = useCallback(async () => {
    const [entriesRes, releasesRes] = await Promise.all([
      fetch(`/api/apps/${appSlug}/changelog`),
      fetch(`/api/apps/${appSlug}/releases`),
    ]);
    if (entriesRes.ok) setEntries(await entriesRes.json());
    if (releasesRes.ok) setAvailReleases(await releasesRes.json());
  }, [appSlug]);

  async function openCreate() {
    const res = await fetch(`/api/apps/${appSlug}/releases`);
    if (res.ok) setAvailReleases(await res.json());
    setEditTarget(null);
    setModalOpen(true);
  }
  async function openEdit(e: ChangelogEntry) {
    const res = await fetch(`/api/apps/${appSlug}/releases`);
    if (res.ok) setAvailReleases(await res.json());
    setEditTarget(e);
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditTarget(null); }

  async function handleSave(data: { type: string; description: string; entryDate: string; releaseId: string }) {
    const url    = editTarget ? `/api/apps/${appSlug}/changelog/${editTarget.id}` : `/api/apps/${appSlug}/changelog`;
    const method = editTarget ? "PATCH" : "POST";
    const body   = {
      type: data.type,
      description: data.description,
      ...(data.entryDate ? { entryDate: data.entryDate } : {}),
      ...(data.releaseId ? { releaseId: data.releaseId } : {}),
    };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Fehler" }));
      throw new Error(err.error ?? "Fehler");
    }
    await refresh();
    closeModal();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/apps/${appSlug}/changelog/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Fehler" }));
      throw new Error(err.error ?? "Fehler");
    }
    await refresh();
    setDeleteTarget(null);
  }

  return (
    <>
      <div style={{ marginTop: 12 }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={openCreate}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", background: "#2563E8", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer" }}
          >
            <Plus size={13} />
            Neuer Eintrag
          </button>
        </div>

        {/* Einträge */}
        {entries.length === 0 ? (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: "28px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#7A8BA6", margin: 0 }}>Noch keine Changelog-Einträge vorhanden.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {entries.map((entry, i) => {
              const cs = TYPE_STYLE[entry.type] ?? TYPE_STYLE.CHANGED;
              return (
                <div key={entry.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 0", borderBottom: i < entries.length - 1 ? "1px solid rgba(30,48,80,0.4)" : "none" }}>
                  <span style={{ flexShrink: 0, padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: cs.color, background: cs.bg, border: `1px solid ${cs.border}`, marginTop: 1 }}>
                    {cs.label}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: "#C8D8EC", margin: 0, lineHeight: 1.45 }}>{entry.description}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "#7A8BA6" }}>{fmt(entry.entryDate)}</span>
                      {entry.release && (
                        <span style={{ fontSize: 10, color: "#2563E8", fontFamily: "monospace" }}>v{entry.release.version}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => openEdit(entry)} title="Bearbeiten"
                      style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 6, cursor: "pointer", color: "#7A8BA6", transition: "color 150ms, border-color 150ms" }}
                      onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#EDF2F7"; b.style.borderColor = "#2563E8"; }}
                      onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#7A8BA6"; b.style.borderColor = "#1E3050"; }}>
                      <Pencil size={11} />
                    </button>
                    <button onClick={() => setDeleteTarget(entry)} title="Löschen"
                      style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 6, cursor: "pointer", color: "#7A8BA6", transition: "color 150ms, border-color 150ms" }}
                      onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#EF4444"; b.style.borderColor = "rgba(239,68,68,0.4)"; }}
                      onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#7A8BA6"; b.style.borderColor = "#1E3050"; }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <EntryModal
          editing={editTarget}
          releases={availReleases}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <DeleteDialog onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
    </>
  );
}
