"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Calendar, Pencil, Trash2, X, Check, Loader2, AlertCircle } from "lucide-react";
import { useCan } from "@/lib/permissions-context";

export type ReleaseItem = {
  id: string;
  version: string;
  releaseType: string;
  releasedAt: string | Date;
  description: string | null;
  isCurrent: boolean;
  createdBy: { name: string | null };
};

const TYPE_OPTIONS = [
  { value: "PATCH",      label: "Patch" },
  { value: "MINOR",      label: "Minor" },
  { value: "MAJOR",      label: "Major" },
  { value: "HOTFIX",     label: "Hotfix" },
  { value: "PRERELEASE", label: "Pre-Release" },
];

const TYPE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  MAJOR:      { color: "#F87171", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)"   },
  MINOR:      { color: "#60A5FA", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)"  },
  PATCH:      { color: "#94A3B8", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" },
  HOTFIX:     { color: "#FB923C", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)"  },
  PRERELEASE: { color: "#C084FC", bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.3)"  },
};

function fmt(d: Date | string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(d));
}

function toISO(d: Date | string) {
  return new Date(d).toISOString();
}

function toDateInput(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

// ─── DSInput / DSTextarea ───────────────────────────────────────────────────

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

function DSSelect({ label, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
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
          backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
          paddingRight: 32, ...props.style,
        }}
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
        style={{
          padding: "9px 12px", background: "#1A2640",
          border: `1px solid ${focused ? "#2563E8" : "#1E3050"}`, borderRadius: 8,
          color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit",
          transition: "border-color 150ms", width: "100%", resize: "vertical",
          minHeight: 68, ...props.style,
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      />
    </div>
  );
}

// ─── Release-Modal ──────────────────────────────────────────────────────────

interface ReleaseModalProps {
  editing: ReleaseItem | null;
  onClose: () => void;
  onSave: (data: { version: string; releaseType: string; releasedAt: string; description: string; isCurrent: boolean }) => Promise<void>;
}

function ReleaseModal({ editing, onClose, onSave }: ReleaseModalProps) {
  const [version, setVersion]           = useState(editing?.version ?? "");
  const [releaseType, setReleaseType]   = useState(editing?.releaseType ?? "PATCH");
  const [releasedAt, setReleasedAt]     = useState(editing ? toDateInput(editing.releasedAt) : new Date().toISOString().slice(0, 10));
  const [description, setDescription]  = useState(editing?.description ?? "");
  const [isCurrent, setIsCurrent]       = useState(editing?.isCurrent ?? false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ version, releaseType, releasedAt: new Date(releasedAt).toISOString(), description, isCurrent });
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
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14, padding: 24, width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 20, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>
            {editing ? "Release bearbeiten" : "Neues Release"}
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#7A8BA6", padding: 4, display: "flex", borderRadius: 6 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EDF2F7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A8BA6"; }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <DSInput label="Version *" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.2.3" required maxLength={20} />
            <DSSelect label="Typ" value={releaseType} onChange={(e) => setReleaseType(e.target.value)}>
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </DSSelect>
          </div>

          <DSInput label="Datum *" type="date" value={releasedAt} onChange={(e) => setReleasedAt(e.target.value)} required />
          <DSTextarea label="Beschreibung" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Was hat sich geändert?" />

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", background: "#1A2640", borderRadius: 8, border: "1px solid #1E3050" }}>
            <div
              onClick={() => setIsCurrent(!isCurrent)}
              style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isCurrent ? "#2563E8" : "#1E3050"}`, background: isCurrent ? "#2563E8" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 150ms" }}
            >
              {isCurrent && <Check size={11} style={{ color: "#fff" }} />}
            </div>
            <span style={{ fontSize: 13, color: "#EDF2F7" }}>Als aktuelle Version markieren</span>
          </label>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#F87171" }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "transparent", color: "#7A8BA6", border: "1px solid #1E3050", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Abbrechen</button>
            <button type="submit" disabled={saving || !version.trim()} style={{ padding: "8px 18px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving || !version.trim() ? "not-allowed" : "pointer", opacity: saving || !version.trim() ? 0.65 : 1, display: "flex", alignItems: "center", gap: 6 }}>
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

function DeleteDialog({ label, onClose, onConfirm }: { label: string; onClose: () => void; onConfirm: () => Promise<void> }) {
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
            <p style={{ fontSize: 14, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>Löschen?</p>
            <p style={{ fontSize: 12, color: "#7A8BA6", margin: "3px 0 0" }}>„{label}" wird dauerhaft entfernt.</p>
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

export function ReleasesTab({ appSlug, initial }: { appSlug: string; initial: ReleaseItem[] }) {
  const canCreate = useCan("app_releases.create");
  const canEdit   = useCan("app_releases.update");
  const canDelete = useCan("app_releases.delete");

  const [releases, setReleases]         = useState<ReleaseItem[]>(initial);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState<ReleaseItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReleaseItem | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/apps/${appSlug}/releases`);
    if (res.ok) setReleases(await res.json());
  }, [appSlug]);

  useEffect(() => { refresh(); }, [refresh]);

  function openCreate() { setEditTarget(null); setModalOpen(true); }
  function openEdit(r: ReleaseItem) { setEditTarget(r); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditTarget(null); }

  async function handleSave(data: { version: string; releaseType: string; releasedAt: string; description: string; isCurrent: boolean }) {
    const url    = editTarget ? `/api/apps/${appSlug}/releases/${editTarget.id}` : `/api/apps/${appSlug}/releases`;
    const method = editTarget ? "PATCH" : "POST";
    const body   = { ...data, description: data.description || undefined };
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Fehler" }));
      throw new Error(err.error ?? "Fehler");
    }
    await refresh();
    closeModal();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/apps/${appSlug}/releases/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Fehler" }));
      throw new Error(err.error ?? "Fehler");
    }
    await refresh();
    setDeleteTarget(null);
  }

  return (
    <>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Toolbar */}
        {canCreate && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
            <button
              onClick={openCreate}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", background: "#2563E8", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer" }}
            >
              <Plus size={13} />
              Neues Release
            </button>
          </div>
        )}

        {/* Liste */}
        {releases.length === 0 ? (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: "28px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#7A8BA6", margin: 0 }}>Noch keine Releases eingetragen.</p>
          </div>
        ) : releases.map((release) => {
          const rt = TYPE_STYLE[release.releaseType];
          return (
            <div key={release.id} style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: "#EDF2F7" }}>v{release.version}</span>
                  {rt && (
                    <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: rt.color, background: rt.bg, border: `1px solid ${rt.border}` }}>
                      {release.releaseType}
                    </span>
                  )}
                  {release.isCurrent && (
                    <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: "#2563E8", background: "rgba(37,99,232,0.12)", border: "1px solid rgba(37,99,232,0.3)" }}>
                      aktuell
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "#7A8BA6", margin: 0, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                      <Calendar size={10} /> {fmt(release.releasedAt)}
                    </p>
                    <p style={{ fontSize: 10, color: "#4A5A72", margin: "2px 0 0" }}>{release.createdBy.name}</p>
                  </div>
                  {(canEdit || canDelete) && (
                    <div style={{ display: "flex", gap: 4 }}>
                      {canEdit && (
                        <button onClick={() => openEdit(release)} title="Bearbeiten"
                          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, cursor: "pointer", color: "#7A8BA6", transition: "color 150ms, border-color 150ms" }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#EDF2F7"; b.style.borderColor = "#2563E8"; }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#7A8BA6"; b.style.borderColor = "#1E3050"; }}>
                          <Pencil size={12} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(release)} title="Löschen"
                          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, cursor: "pointer", color: "#7A8BA6", transition: "color 150ms, border-color 150ms" }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#EF4444"; b.style.borderColor = "rgba(239,68,68,0.4)"; }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#7A8BA6"; b.style.borderColor = "#1E3050"; }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {release.description && (
                <p style={{ fontSize: 12, color: "#7A8BA6", marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(30,48,80,0.6)", margin: "10px 0 0" }}>
                  {release.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <ReleaseModal editing={editTarget} onClose={closeModal} onSave={handleSave} />
      )}
      {deleteTarget && (
        <DeleteDialog label={`v${deleteTarget.version}`} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
    </>
  );
}
