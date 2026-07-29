"use client";

import { useState, useCallback } from "react";
import {
  Activity, CheckCircle, AlertCircle, XCircle, HelpCircle,
  Plus, Trash2, Loader2, Save, ToggleLeft, ToggleRight, RefreshCw, X,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── Typen ─────────────────────────────────────────────────────────────────

type HealthCheck = {
  id: string;
  configId: string | null;
  checkUrl: string | null;
  status: string;
  responseTime: number | null;
  statusCode: number | null;
  errorMsg: string | null;
  checkedAt: string;
};

type MonitorConfig = {
  id: string;
  label: string;
  enabled: boolean;
  intervalMin: number;
  timeoutSec: number;
  checkUrl: string | null;
  expectedStatus: number;
  healthChecks: HealthCheck[];
};

// ─── Konstanten ─────────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, React.ReactNode> = {
  UP:      <CheckCircle size={12} style={{ color: "#10B981" }} />,
  DEGRADED:<AlertCircle size={12} style={{ color: "#F59E0B" }} />,
  DOWN:    <XCircle     size={12} style={{ color: "#EF4444" }} />,
  UNKNOWN: <HelpCircle  size={12} style={{ color: "#7A8BA6" }} />,
};
const STATUS_COLOR: Record<string, string> = {
  UP: "#10B981", DEGRADED: "#F59E0B", DOWN: "#EF4444", UNKNOWN: "#7A8BA6",
};

function fmt(d: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "medium" }).format(new Date(d));
}

function uptimePct(checks: HealthCheck[]) {
  if (checks.length === 0) return null;
  return ((checks.filter((c) => c.status === "UP").length / checks.length) * 100).toFixed(1);
}
function avgMs(checks: HealthCheck[]) {
  const valid = checks.filter((c) => c.responseTime != null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((s, c) => s + (c.responseTime ?? 0), 0) / valid.length);
}

// ─── Mini-Chart pro Endpoint ─────────────────────────────────────────────────

function EndpointChart({ checks }: { checks: HealthCheck[] }) {
  const data = [...checks].reverse().slice(-48).map((c) => ({
    time: new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(c.checkedAt)),
    ms: c.responseTime ?? 0,
  }));
  if (data.length === 0) return <p style={{ fontSize: 11, color: "#7A8BA6", textAlign: "center", margin: "12px 0" }}>Noch keine Daten</p>;
  return (
    <ResponsiveContainer width="100%" height={70}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="epGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2563E8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2563E8" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,48,80,0.8)" vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 8, fill: "#7A8BA6" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 8, fill: "#7A8BA6" }} tickLine={false} axisLine={false} unit="ms" />
        <Tooltip
          contentStyle={{ background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8, fontSize: 11, color: "#EDF2F7" }}
          formatter={(val) => [`${val ?? 0}ms`, "Antwortzeit"]}
        />
        <Area type="monotone" dataKey="ms" stroke="#2563E8" strokeWidth={1.5} fill="url(#epGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Einzelner Endpoint-Block ─────────────────────────────────────────────────

function EndpointCard({
  config,
  appSlug,
  onUpdate,
  onDelete,
}: {
  config: MonitorConfig;
  appSlug: string;
  onUpdate: (updated: MonitorConfig) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: config.label,
    enabled: config.enabled,
    checkUrl: config.checkUrl ?? "",
    intervalMin: config.intervalMin,
    timeoutSec: config.timeoutSec,
    expectedStatus: config.expectedStatus,
  });

  const lastCheck = config.healthChecks[0];
  const up = uptimePct(config.healthChecks);
  const avg = avgMs(config.healthChecks);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/apps/${appSlug}/monitor?id=${config.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
      setEditing(false);
    }
    setSaving(false);
  }

  async function runCheck() {
    setChecking(true);
    const res = await fetch(`/api/apps/${appSlug}/monitor/check?id=${config.id}`, { method: "POST" });
    if (res.ok) {
      // Config mit frischen Checks neu laden
      const configRes = await fetch(`/api/apps/${appSlug}/monitor`);
      if (configRes.ok) {
        const allConfigs: MonitorConfig[] = await configRes.json();
        const fresh = allConfigs.find((c) => c.id === config.id);
        if (fresh) onUpdate(fresh);
      }
    }
    setChecking(false);
  }

  async function remove() {
    if (!confirm(`Endpoint "${config.label}" wirklich löschen?`)) return;
    setDeleting(true);
    await fetch(`/api/apps/${appSlug}/monitor?id=${config.id}`, { method: "DELETE" });
    onDelete(config.id);
    setDeleting(false);
  }

  const statusColor = lastCheck ? STATUS_COLOR[lastCheck.status] : "#7A8BA6";

  return (
    <div style={{ background: "#111C2D", border: `1px solid ${lastCheck ? statusColor + "44" : "#1E3050"}`, borderLeft: `3px solid ${statusColor}`, borderRadius: 12 }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ flexShrink: 0 }}>{lastCheck ? STATUS_ICON[lastCheck.status] : <HelpCircle size={12} style={{ color: "#7A8BA6" }} />}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>{config.label}</span>
            {!config.enabled && (
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "#1A2640", color: "#7A8BA6" }}>deaktiviert</span>
            )}
          </div>
          {config.checkUrl && (
            <p style={{ fontSize: 11, color: "#7A8BA6", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {config.checkUrl}
            </p>
          )}
        </div>
        {/* Metriken */}
        <div style={{ display: "flex", gap: 12, fontSize: 11, flexShrink: 0 }}>
          {up !== null && <span style={{ color: "#10B981", fontWeight: 600 }}>{up}%</span>}
          {avg !== null && <span style={{ color: "#7A8BA6" }}>ø {avg}ms</span>}
          {lastCheck && <span style={{ color: STATUS_COLOR[lastCheck.status], fontWeight: 600 }}>{lastCheck.status}</span>}
        </div>
        {/* Aktionen */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            onClick={runCheck}
            disabled={checking || !config.checkUrl}
            title="Jetzt prüfen"
            style={{ padding: 6, background: "none", border: "1px solid #1E3050", borderRadius: 6, color: checking ? "#7A8BA6" : "#2563E8", cursor: checking || !config.checkUrl ? "not-allowed" : "pointer", opacity: !config.checkUrl ? 0.4 : 1 }}>
            {checking ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
          <button
            onClick={() => setEditing((e) => !e)}
            title="Bearbeiten"
            style={{ padding: 6, background: editing ? "#1A2640" : "none", border: "1px solid #1E3050", borderRadius: 6, color: "#EDF2F7", cursor: "pointer" }}>
            <Save size={12} />
          </button>
          <button
            onClick={remove}
            disabled={deleting}
            title="Löschen"
            style={{ padding: 6, background: "none", border: "1px solid #1E3050", borderRadius: 6, color: "#EF4444", cursor: "pointer" }}>
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </div>

      {/* Chart */}
      {config.healthChecks.length > 0 && (
        <div style={{ padding: "0 16px 8px" }}>
          <EndpointChart checks={config.healthChecks} />
        </div>
      )}

      {/* Edit-Formular */}
      {editing && (
        <div style={{ borderTop: "1px solid #1E3050", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Name", key: "label", type: "text", placeholder: "z.B. Production, Staging, API" },
              { label: "Check-URL", key: "checkUrl", type: "url", placeholder: "https://example.com/health" },
              { label: "Intervall (Min)", key: "intervalMin", type: "number" },
              { label: "Timeout (Sek)", key: "timeoutSec", type: "number" },
              { label: "Erwarteter Status", key: "expectedStatus", type: "number" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 10, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 3 }}>{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form] as string | number}
                  placeholder={placeholder}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? +e.target.value : e.target.value }))}
                  style={{ width: "100%", padding: "6px 10px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, color: "#EDF2F7", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))} style={{ background: "none", border: "none", cursor: "pointer", color: form.enabled ? "#10B981" : "#7A8BA6", padding: 0 }}>
                {form.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
              <span style={{ fontSize: 12, color: "#EDF2F7" }}>{form.enabled ? "Aktiv" : "Deaktiviert"}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(false)} style={{ padding: "5px 12px", background: "none", border: "1px solid #1E3050", borderRadius: 7, fontSize: 12, color: "#7A8BA6", cursor: "pointer" }}>
              Abbrechen
            </button>
            <button onClick={save} disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Letzte Checks */}
      {!editing && config.healthChecks.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(30,48,80,0.5)", padding: "8px 16px 12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {config.healthChecks.slice(0, 5).map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#7A8BA6" }}>
                {STATUS_ICON[c.status]}
                <span style={{ color: STATUS_COLOR[c.status], fontWeight: 600, minWidth: 65 }}>{c.status}</span>
                <span style={{ flex: 1 }}>{fmt(c.checkedAt)}</span>
                {c.responseTime != null && <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 45, textAlign: "right", color: "#EDF2F7" }}>{c.responseTime}ms</span>}
                {c.statusCode && <span style={{ minWidth: 28, textAlign: "right" }}>{c.statusCode}</span>}
                {c.errorMsg && <span style={{ color: "#F87171", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.errorMsg}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Neues-Endpoint-Formular ─────────────────────────────────────────────────

function AddEndpointForm({
  appSlug,
  suggestedUrls,
  onAdd,
  onClose,
}: {
  appSlug: string;
  suggestedUrls: { label: string; url: string }[];
  onAdd: (config: MonitorConfig) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    label: suggestedUrls[0]?.label ?? "Production",
    checkUrl: suggestedUrls[0]?.url ?? "",
    intervalMin: 5,
    timeoutSec: 10,
    expectedStatus: 200,
    enabled: true,
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.checkUrl) return;
    setSaving(true);
    const res = await fetch(`/api/apps/${appSlug}/monitor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      onAdd(created);
      onClose();
    }
    setSaving(false);
  }

  return (
    <div style={{ background: "#111C2D", border: "1px solid #2563E8", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>Neuer Monitoring-Endpoint</p>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#7A8BA6", cursor: "pointer", padding: 2 }}>
          <X size={14} />
        </button>
      </div>

      {/* Vorschläge aus App-URLs */}
      {suggestedUrls.length > 0 && (
        <div>
          <p style={{ fontSize: 10, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", margin: "0 0 6px" }}>Aus App-URLs übernehmen</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {suggestedUrls.map(({ label, url }) => (
              <button
                key={label}
                onClick={() => setForm((f) => ({ ...f, label, checkUrl: url }))}
                style={{
                  padding: "4px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer",
                  border: `1px solid ${form.checkUrl === url ? "#2563E8" : "#1E3050"}`,
                  background: form.checkUrl === url ? "rgba(37,99,232,0.15)" : "#1A2640",
                  color: form.checkUrl === url ? "#60A5FA" : "#7A8BA6",
                }}>
                {label} — {url.replace(/https?:\/\//, "").substring(0, 40)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Name", key: "label", type: "text", placeholder: "z.B. Production, Staging" },
          { label: "Check-URL *", key: "checkUrl", type: "url", placeholder: "https://example.com/health" },
          { label: "Intervall (Min)", key: "intervalMin", type: "number" },
          { label: "Timeout (Sek)", key: "timeoutSec", type: "number" },
          { label: "Erwarteter Status", key: "expectedStatus", type: "number" },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label style={{ fontSize: 10, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 3 }}>{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form] as string | number}
              placeholder={placeholder}
              onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? +e.target.value : e.target.value }))}
              style={{ width: "100%", padding: "6px 10px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, color: "#EDF2F7", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "6px 14px", background: "none", border: "1px solid #1E3050", borderRadius: 7, fontSize: 12, color: "#7A8BA6", cursor: "pointer" }}>
          Abbrechen
        </button>
        <button onClick={submit} disabled={saving || !form.checkUrl}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: saving || !form.checkUrl ? "not-allowed" : "pointer", opacity: saving || !form.checkUrl ? 0.55 : 1 }}>
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
          Hinzufügen
        </button>
      </div>
    </div>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export function MonitorTab({
  appSlug,
  initial,
  appUrls,
}: {
  appSlug: string;
  initial: MonitorConfig[];
  appUrls: { label: string; url: string }[];
}) {
  const [configs, setConfigs] = useState<MonitorConfig[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);

  const handleUpdate = useCallback((updated: MonitorConfig) => {
    setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleAdd = useCallback((created: MonitorConfig) => {
    setConfigs((prev) => [...prev, created]);
  }, []);

  async function checkAll() {
    setCheckingAll(true);
    const res = await fetch(`/api/apps/${appSlug}/monitor/check`, { method: "POST" });
    if (res.ok) {
      // Alle Configs neu laden
      const configRes = await fetch(`/api/apps/${appSlug}/monitor`);
      if (configRes.ok) setConfigs(await configRes.json());
    }
    setCheckingAll(false);
  }

  // Gesamtübersicht
  const allChecks = configs.flatMap((c) => c.healthChecks);
  const totalUp = uptimePct(allChecks);
  const totalAvg = avgMs(allChecks);
  const worstStatus = configs.some((c) => c.healthChecks[0]?.status === "DOWN")
    ? "DOWN"
    : configs.some((c) => c.healthChecks[0]?.status === "DEGRADED")
    ? "DEGRADED"
    : configs.some((c) => c.healthChecks[0]?.status === "UP")
    ? "UP"
    : "UNKNOWN";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header-Zeile */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        {/* Gesamt-Status */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {STATUS_ICON[worstStatus]}
            <span style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLOR[worstStatus] }}>{worstStatus}</span>
          </div>
          {totalUp !== null && <span style={{ fontSize: 11, color: "#7A8BA6" }}>{totalUp}% uptime</span>}
          {totalAvg !== null && <span style={{ fontSize: 11, color: "#7A8BA6" }}>ø {totalAvg}ms</span>}
          <span style={{ fontSize: 11, color: "#7A8BA6" }}>{configs.length} {configs.length === 1 ? "Endpoint" : "Endpoints"}</span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={checkAll}
            disabled={checkingAll || configs.length === 0}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 8, fontSize: 12, color: "#EDF2F7", cursor: checkingAll || configs.length === 0 ? "not-allowed" : "pointer", opacity: configs.length === 0 ? 0.5 : 1 }}>
            {checkingAll ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Alle prüfen
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={12} /> Endpoint hinzufügen
          </button>
        </div>
      </div>

      {/* Formular für neuen Endpoint */}
      {showAdd && (
        <AddEndpointForm
          appSlug={appSlug}
          suggestedUrls={appUrls}
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Keine Endpoints */}
      {configs.length === 0 && !showAdd && (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <Activity size={32} style={{ color: "#2563E8", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 13, color: "#EDF2F7", margin: "0 0 4px", fontWeight: 600 }}>Monitoring einrichten</p>
          <p style={{ fontSize: 12, color: "#7A8BA6", margin: "0 0 16px" }}>
            Füge einen oder mehrere Endpoints hinzu, um diese App automatisch zu überwachen.
          </p>
          {appUrls.length > 0 && (
            <p style={{ fontSize: 11, color: "#2563E8", margin: "0 0 12px" }}>
              {appUrls.length} App-URL{appUrls.length > 1 ? "s" : ""} als Vorschlag verfügbar
            </p>
          )}
          <button
            onClick={() => setShowAdd(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={12} /> Ersten Endpoint hinzufügen
          </button>
        </div>
      )}

      {/* Endpoint-Karten */}
      {configs.map((cfg) => (
        <EndpointCard
          key={cfg.id}
          config={cfg}
          appSlug={appSlug}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}

      {/* Hinweis zum Worker */}
      {configs.length > 0 && (
        <div style={{ padding: "8px 12px", background: "rgba(37,99,232,0.06)", border: "1px solid rgba(37,99,232,0.2)", borderRadius: 8, fontSize: 11, color: "#7A8BA6" }}>
          Automatische Checks laufen alle {configs[0]?.intervalMin ?? 5} Minuten, wenn der Worker aktiv ist:{" "}
          <code style={{ background: "#1A2640", padding: "1px 5px", borderRadius: 4, color: "#60A5FA" }}>npm run worker</code>
        </div>
      )}
    </div>
  );
}
