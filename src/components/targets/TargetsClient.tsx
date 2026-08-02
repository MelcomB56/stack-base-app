"use client";

import { useState } from "react";
import { Server, Cloud, Container, Layers, Globe, Plus, Pencil, Trash2, X, Loader2, Check } from "lucide-react";

type TargetType = "SERVER" | "CLOUD" | "KUBERNETES" | "PAAS" | "OTHER";

const TYPE_META: Record<TargetType, { label: string; icon: React.ReactNode; color: string }> = {
  SERVER:     { label: "Server / VPS",  icon: <Server size={13} />,    color: "#3B82F6" },
  CLOUD:      { label: "Cloud",         icon: <Cloud size={13} />,     color: "#8B5CF6" },
  KUBERNETES: { label: "Kubernetes",    icon: <Layers size={13} />,    color: "#06B6D4" },
  PAAS:       { label: "PaaS",          icon: <Globe size={13} />,     color: "#10B981" },
  OTHER:      { label: "Sonstiges",     icon: <Container size={13} />, color: "#6B7280" },
};

const RUNTIME_OPTIONS = [
  { value: "DOCKER",        label: "Docker" },
  { value: "DOCKER_COMPOSE",label: "Docker Compose" },
  { value: "KUBERNETES",    label: "Kubernetes" },
  { value: "SYSTEMD",       label: "Systemd Service" },
  { value: "PM2",           label: "PM2" },
  { value: "BARE_PROCESS",  label: "Bare Process" },
  { value: "STATIC",        label: "Static / Webserver" },
  { value: "SERVERLESS",    label: "Serverless / FaaS" },
  { value: "PAAS",          label: "PaaS (Heroku, Render …)" },
  { value: "IIS",           label: "IIS / Windows Service" },
  { value: "OTHER",         label: "Sonstiges" },
];

type Target = {
  id: string;
  name: string;
  type: TargetType;
  host: string | null;
  provider: string | null;
  region: string | null;
  notes: string | null;
  appCount: number;
};

const EMPTY: Omit<Target, "id" | "appCount"> = {
  name: "", type: "SERVER", host: "", provider: "", region: "", notes: "",
};

const INPUT: React.CSSProperties = {
  width: "100%", padding: "7px 12px", background: "#1A2640",
  border: "1px solid #1E3050", borderRadius: 8, color: "#EDF2F7",
  fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};
const LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#7A8BA6",
  textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 4,
};

function TypeBadge({ type }: { type: TargetType }) {
  const m = TYPE_META[type];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500, color: m.color, background: `${m.color}22`, border: `1px solid ${m.color}44` }}>
      {m.icon} {m.label}
    </span>
  );
}

function TargetForm({
  initial, onSave, onCancel, loading,
}: {
  initial: Omit<Target, "id" | "appCount">;
  onSave: (data: Omit<Target, "id" | "appCount">) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={LABEL}>Name *</label>
          <input style={INPUT} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="z.B. Hetzner CX33" maxLength={100} />
        </div>
        <div>
          <label style={LABEL}>Typ</label>
          <select style={{ ...INPUT, appearance: "none", cursor: "pointer" }} value={form.type} onChange={(e) => set("type", e.target.value as TargetType)}>
            {(Object.keys(TYPE_META) as TargetType[]).map((t) => (
              <option key={t} value={t}>{TYPE_META[t].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={LABEL}>Host / IP</label>
          <input style={INPUT} value={form.host ?? ""} onChange={(e) => set("host", e.target.value)} placeholder="192.168.1.10 oder server.example.de" maxLength={255} />
        </div>
        <div>
          <label style={LABEL}>Provider</label>
          <input style={INPUT} value={form.provider ?? ""} onChange={(e) => set("provider", e.target.value)} placeholder="Hetzner, AWS, Vercel …" maxLength={100} />
        </div>
        <div>
          <label style={LABEL}>Region / Standort</label>
          <input style={INPUT} value={form.region ?? ""} onChange={(e) => set("region", e.target.value)} placeholder="Frankfurt, US-East …" maxLength={100} />
        </div>
        <div>
          <label style={LABEL}>Notizen</label>
          <input style={INPUT} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Freitext …" maxLength={500} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
        <button type="button" onClick={onCancel} style={{ padding: "7px 14px", background: "transparent", border: "1px solid #1E3050", borderRadius: 8, color: "#7A8BA6", fontSize: 13, cursor: "pointer" }}>
          Abbrechen
        </button>
        <button
          type="button"
          disabled={!form.name.trim() || loading}
          onClick={() => onSave(form)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#2563E8", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: !form.name.trim() || loading ? "not-allowed" : "pointer", opacity: !form.name.trim() || loading ? 0.6 : 1 }}
        >
          {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
          Speichern
        </button>
      </div>
    </div>
  );
}

export function TargetsClient({ initial }: { initial: Target[] }) {
  const [targets, setTargets]   = useState<Target[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleCreate(data: Omit<Target, "id" | "appCount">) {
    setLoading(true); setError(null);
    const res = await fetch("/api/targets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Fehler"); setLoading(false); return; }
    setTargets((t) => [...t, { ...json, appCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
    setCreating(false); setLoading(false);
  }

  async function handleUpdate(id: string, data: Omit<Target, "id" | "appCount">) {
    setLoading(true); setError(null);
    const res = await fetch(`/api/targets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Fehler"); setLoading(false); return; }
    setTargets((t) => t.map((x) => x.id === id ? { ...json, appCount: x.appCount } : x).sort((a, b) => a.name.localeCompare(b.name)));
    setEditing(null); setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    const t = targets.find((x) => x.id === id);
    if (t && t.appCount > 0) { setError(`„${name}" ist noch ${t.appCount} App(s) zugewiesen. Zuerst Zuweisungen entfernen.`); return; }
    if (!confirm(`Target „${name}" wirklich löschen?`)) return;
    await fetch(`/api/targets/${id}`, { method: "DELETE" });
    setTargets((t) => t.filter((x) => x.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#EF444422", border: "1px solid #EF444444", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#EF4444" }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      {/* Neue anlegen */}
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18 }}>
        {creating ? (
          <TargetForm initial={EMPTY} onSave={handleCreate} onCancel={() => setCreating(false)} loading={loading} />
        ) : (
          <button
            onClick={() => setCreating(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#2563E8", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={14} /> Neues Target anlegen
          </button>
        )}
      </div>

      {/* Liste */}
      {targets.length === 0 && !creating && (
        <p style={{ color: "#4A5B6F", fontSize: 13, textAlign: "center", padding: 32 }}>
          Noch keine Targets angelegt. Erstelle dein erstes Deployment Target oben.
        </p>
      )}

      {targets.map((t) => (
        <div key={t.id} style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18 }}>
          {editing === t.id ? (
            <TargetForm
              initial={{ name: t.name, type: t.type, host: t.host, provider: t.provider, region: t.region, notes: t.notes }}
              onSave={(data) => handleUpdate(t.id, data)}
              onCancel={() => setEditing(null)}
              loading={loading}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              {/* Icon */}
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${TYPE_META[t.type].color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: TYPE_META[t.type].color }}>
                {TYPE_META[t.type].icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#EDF2F7" }}>{t.name}</span>
                  <TypeBadge type={t.type} />
                  {t.appCount > 0 && (
                    <span style={{ fontSize: 11, color: "#7A8BA6", background: "#1A2640", padding: "2px 8px", borderRadius: 20, border: "1px solid #1E3050" }}>
                      {t.appCount} App{t.appCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 5 }}>
                  {t.host     && <span style={{ fontSize: 12, color: "#7A8BA6" }}>🖥 {t.host}</span>}
                  {t.provider && <span style={{ fontSize: 12, color: "#7A8BA6" }}>☁ {t.provider}</span>}
                  {t.region   && <span style={{ fontSize: 12, color: "#7A8BA6" }}>📍 {t.region}</span>}
                  {t.notes    && <span style={{ fontSize: 12, color: "#4A5B6F", fontStyle: "italic" }}>{t.notes}</span>}
                </div>
              </div>

              {/* Aktionen */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => setEditing(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", background: "transparent", border: "1px solid #1E3050", borderRadius: 8, color: "#7A8BA6", fontSize: 12, cursor: "pointer" }}>
                  <Pencil size={12} /> Bearbeiten
                </button>
                <button onClick={() => handleDelete(t.id, t.name)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, background: "transparent", border: "1px solid #1E3050", borderRadius: 8, color: "#EF4444", cursor: "pointer" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
