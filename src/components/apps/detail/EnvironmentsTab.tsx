"use client";

import { useState } from "react";
import { Plus, ExternalLink, Trash2, Pencil, Check, X } from "lucide-react";
import { useCan } from "@/lib/permissions-context";

type EnvType = "DEVELOPMENT" | "STAGING" | "PRODUCTION" | "CUSTOM";
type EnvStatus = "ONLINE" | "OFFLINE" | "DEGRADED" | "UNKNOWN" | "MAINTENANCE";

interface AppEnvironment {
  id: string;
  name: string;
  type: EnvType;
  url: string | null;
  status: EnvStatus;
  statusNote: string | null;
  sortOrder: number;
}

const TYPE_LABELS: Record<EnvType, string> = {
  DEVELOPMENT: "Dev",
  STAGING: "Staging",
  PRODUCTION: "Prod",
  CUSTOM: "Custom",
};

const TYPE_COLORS: Record<EnvType, string> = {
  DEVELOPMENT: "#22D3EE",
  STAGING: "#F59E0B",
  PRODUCTION: "#10B981",
  CUSTOM: "#7A8BA6",
};

const STATUS_COLORS: Record<EnvStatus, string> = {
  ONLINE: "#10B981",
  OFFLINE: "#EF4444",
  DEGRADED: "#F59E0B",
  UNKNOWN: "#7A8BA6",
  MAINTENANCE: "#8B5CF6",
};

const STATUS_LABELS: Record<EnvStatus, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  DEGRADED: "Degradiert",
  UNKNOWN: "Unbekannt",
  MAINTENANCE: "Wartung",
};

const ENV_STATUS_OPTIONS: EnvStatus[] = ["ONLINE", "DEGRADED", "MAINTENANCE", "OFFLINE", "UNKNOWN"];
const ENV_TYPE_OPTIONS: EnvType[] = ["PRODUCTION", "STAGING", "DEVELOPMENT", "CUSTOM"];

function StatusDot({ status }: { status: EnvStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "2px 8px", borderRadius: 99,
      background: `${color}22`, border: `1px solid ${color}44`,
      fontSize: 11, fontWeight: 600, color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function TypeBadge({ type }: { type: EnvType }) {
  const color = TYPE_COLORS[type];
  return (
    <span style={{
      padding: "2px 7px", borderRadius: 4,
      background: `${color}18`, border: `1px solid ${color}33`,
      fontSize: 10, fontWeight: 700, color, letterSpacing: ".08em",
      textTransform: "uppercase",
    }}>
      {TYPE_LABELS[type]}
    </span>
  );
}

export function EnvironmentsTab({ appSlug, initialEnvironments }: {
  appSlug: string;
  initialEnvironments: AppEnvironment[];
}) {
  const canCreate = useCan("app_environments.create");
  const canEdit   = useCan("app_environments.update");
  const canDelete = useCan("app_environments.delete");

  const [environments, setEnvironments] = useState<AppEnvironment[]>(initialEnvironments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<AppEnvironment>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newEnv, setNewEnv] = useState({ name: "", type: "PRODUCTION" as EnvType, url: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addEnvironment() {
    if (!newEnv.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/apps/${appSlug}/environments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEnv.name.trim(),
          type: newEnv.type,
          url: newEnv.url.trim() || undefined,
          status: "UNKNOWN",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setEnvironments((prev) => [...prev, created]);
      setNewEnv({ name: "", type: "PRODUCTION", url: "" });
      setShowAdd(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/apps/${appSlug}/environments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setEnvironments((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEnvironment(id: string) {
    if (!confirm("Environment löschen?")) return;
    try {
      await fetch(`/api/apps/${appSlug}/environments/${id}`, { method: "DELETE" });
      setEnvironments((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Löschen fehlgeschlagen");
    }
  }

  function startEdit(env: AppEnvironment) {
    setEditingId(env.id);
    setEditDraft({ name: env.name, type: env.type, url: env.url ?? "", status: env.status, statusNote: env.statusNote ?? "" });
  }

  const inputStyle: React.CSSProperties = {
    background: "#0B1220", border: "1px solid #1E3050", borderRadius: 6,
    padding: "5px 10px", fontSize: 12, color: "#EDF2F7", outline: "none", width: "100%",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, width: "auto", minWidth: 120 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>Environments</h3>
          <p style={{ fontSize: 12, color: "#7A8BA6", margin: "2px 0 0" }}>
            Deployment-Umgebungen dieser App mit individuellem Status
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setShowAdd(true); setError(""); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: "#2563E8", color: "#fff", border: "none", cursor: "pointer",
            }}
          >
            <Plus size={13} />
            Environment hinzufügen
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid #EF444440", fontSize: 12, color: "#F87171" }}>
          {error}
        </div>
      )}

      {/* Add form */}
      {canCreate && showAdd && (
        <div style={{ padding: 16, borderRadius: 8, border: "1px solid #2563E840", background: "rgba(37,99,232,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>Neue Umgebung</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Name *</label>
              <input
                style={inputStyle}
                placeholder="Production, Staging, Dev..."
                value={newEnv.name}
                onChange={(e) => setNewEnv((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addEnvironment()}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Typ</label>
              <select
                style={{ ...selectStyle, width: "100%" }}
                value={newEnv.type}
                onChange={(e) => setNewEnv((p) => ({ ...p, type: e.target.value as EnvType }))}
              >
                {ENV_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>URL</label>
              <input
                style={inputStyle}
                placeholder="https://app.example.com"
                value={newEnv.url}
                onChange={(e) => setNewEnv((p) => ({ ...p, url: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={addEnvironment}
              disabled={saving || !newEnv.name.trim()}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                background: saving ? "#1A2640" : "#2563E8", color: saving ? "#7A8BA6" : "#fff",
                border: "none", cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Speichern..." : "Hinzufügen"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setError(""); }}
              style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, background: "transparent", border: "1px solid #1E3050", color: "#7A8BA6", cursor: "pointer" }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {environments.length === 0 && !showAdd && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "#7A8BA6" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌐</div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#EDF2F7", margin: "0 0 4px" }}>Keine Environments</p>
          <p style={{ fontSize: 12, margin: 0 }}>Füge Dev-, Staging- und Production-URLs mit individuellem Status hinzu.</p>
        </div>
      )}

      {/* Environment cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {environments.map((env) => {
          const isEditing = editingId === env.id;
          return (
            <div
              key={env.id}
              style={{
                padding: 16, borderRadius: 8, border: "1px solid #1E3050",
                background: "#111C2D", display: "flex", flexDirection: "column", gap: 10,
              }}
            >
              {isEditing ? (
                // Edit mode
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr 140px", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Name</label>
                      <input
                        style={inputStyle}
                        value={editDraft.name ?? ""}
                        onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Typ</label>
                      <select
                        style={{ ...selectStyle, width: "100%" }}
                        value={editDraft.type ?? "CUSTOM"}
                        onChange={(e) => setEditDraft((p) => ({ ...p, type: e.target.value as EnvType }))}
                      >
                        {ENV_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>URL</label>
                      <input
                        style={inputStyle}
                        placeholder="https://..."
                        value={editDraft.url ?? ""}
                        onChange={(e) => setEditDraft((p) => ({ ...p, url: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Status</label>
                      <select
                        style={{ ...selectStyle, width: "100%" }}
                        value={editDraft.status ?? "UNKNOWN"}
                        onChange={(e) => setEditDraft((p) => ({ ...p, status: e.target.value as EnvStatus }))}
                      >
                        {ENV_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 4 }}>Notiz</label>
                    <input
                      style={inputStyle}
                      placeholder="Optionale Statusnotiz..."
                      value={editDraft.statusNote ?? ""}
                      onChange={(e) => setEditDraft((p) => ({ ...p, statusNote: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => saveEdit(env.id)}
                      disabled={saving}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, fontSize: 12, background: "#2563E8", color: "#fff", border: "none", cursor: "pointer" }}
                    >
                      <Check size={12} /> Speichern
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setError(""); }}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, fontSize: 12, background: "transparent", border: "1px solid #1E3050", color: "#7A8BA6", cursor: "pointer" }}
                    >
                      <X size={12} /> Abbrechen
                    </button>
                  </div>
                </>
              ) : (
                // View mode
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <TypeBadge type={env.type} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>{env.name}</span>
                      <StatusDot status={env.status} />
                    </div>
                    {env.url ? (
                      <a
                        href={env.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#2563E8", textDecoration: "none" }}
                      >
                        <ExternalLink size={11} />
                        {env.url}
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: "#7A8BA6" }}>Keine URL konfiguriert</span>
                    )}
                    {env.statusNote && (
                      <p style={{ fontSize: 11, color: "#7A8BA6", margin: "4px 0 0" }}>{env.statusNote}</p>
                    )}
                  </div>
                  {(canEdit || canDelete) && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {canEdit && (
                        <button
                          onClick={() => startEdit(env)}
                          style={{ padding: "5px 8px", borderRadius: 6, background: "transparent", border: "1px solid #1E3050", color: "#7A8BA6", cursor: "pointer", display: "flex", alignItems: "center" }}
                          title="Bearbeiten"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => deleteEnvironment(env.id)}
                          style={{ padding: "5px 8px", borderRadius: 6, background: "transparent", border: "1px solid #1E3050", color: "#7A8BA6", cursor: "pointer", display: "flex", alignItems: "center" }}
                          title="Löschen"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
