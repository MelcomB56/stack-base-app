"use client";

import { useState } from "react";
import { Activity, CheckCircle, AlertCircle, XCircle, HelpCircle, Save, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type HealthCheck = {
  id: string;
  status: string;
  responseTime: number | null;
  statusCode: number | null;
  errorMsg: string | null;
  checkedAt: string | Date;
};

type MonitorConfig = {
  id: string;
  enabled: boolean;
  intervalMin: number;
  timeoutSec: number;
  checkUrl: string | null;
  expectedStatus: number;
} | null;

const STATUS_ICON: Record<string, React.ReactNode> = {
  UP: <CheckCircle size={12} style={{ color: "#10B981" }} />,
  DEGRADED: <AlertCircle size={12} style={{ color: "#F59E0B" }} />,
  DOWN: <XCircle size={12} style={{ color: "#EF4444" }} />,
  UNKNOWN: <HelpCircle size={12} style={{ color: "#7A8BA6" }} />,
};
const STATUS_COLOR: Record<string, string> = {
  UP: "#10B981", DEGRADED: "#F59E0B", DOWN: "#EF4444", UNKNOWN: "#7A8BA6",
};

function fmt(d: string | Date) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "medium" }).format(new Date(d));
}

export function MonitorTab({ appSlug, initial }: { appSlug: string; initial: { config: MonitorConfig; checks: HealthCheck[] } }) {
  const [config, setConfig] = useState<MonitorConfig>(initial.config);
  const [checks] = useState<HealthCheck[]>(initial.checks);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    enabled: initial.config?.enabled ?? false,
    checkUrl: initial.config?.checkUrl ?? "",
    intervalMin: initial.config?.intervalMin ?? 5,
    timeoutSec: initial.config?.timeoutSec ?? 10,
    expectedStatus: initial.config?.expectedStatus ?? 200,
  });
  const [saving, setSaving] = useState(false);

  async function saveConfig() {
    setSaving(true);
    const res = await fetch(`/api/apps/${appSlug}/monitor`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setConfig(updated);
      setEditing(false);
    }
    setSaving(false);
  }

  const chartData = [...checks]
    .reverse()
    .slice(-60)
    .map((c) => ({
      time: new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(c.checkedAt)),
      ms: c.responseTime ?? 0,
      status: c.status,
    }));

  const uptime = checks.length > 0
    ? ((checks.filter((c) => c.status === "UP").length / checks.length) * 100).toFixed(2)
    : "—";
  const avgMs = checks.filter((c) => c.responseTime).length > 0
    ? Math.round(checks.filter((c) => c.responseTime).reduce((s, c) => s + (c.responseTime ?? 0), 0) / checks.filter((c) => c.responseTime).length)
    : null;
  const lastCheck = checks[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Status-Kacheln */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Status", value: lastCheck ? lastCheck.status : "—", color: lastCheck ? STATUS_COLOR[lastCheck.status] : "#7A8BA6", icon: lastCheck ? STATUS_ICON[lastCheck.status] : <HelpCircle size={12} style={{ color: "#7A8BA6" }} /> },
          { label: "Uptime (24h)", value: `${uptime}%`, color: "#10B981" },
          { label: "Ø Antwortzeit", value: avgMs !== null ? `${avgMs}ms` : "—", color: avgMs !== null && avgMs < 500 ? "#10B981" : avgMs !== null && avgMs < 2000 ? "#F59E0B" : "#EF4444" },
          { label: "Letzter Check", value: lastCheck ? fmt(lastCheck.checkedAt) : "—", color: "#EDF2F7" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 10, color: "#7A8BA6", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: ".08em", display: "flex", alignItems: "center", gap: 4 }}>
              {icon && icon}{label}
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color, margin: 0, fontVariantNumeric: "tabular-nums" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Response-Time Chart */}
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <Activity size={11} /> Antwortzeiten (letzte 5h)
        </p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563E8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563E8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,48,80,0.8)" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#7A8BA6" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "#7A8BA6" }} tickLine={false} axisLine={false} unit="ms" />
              <Tooltip
                contentStyle={{ background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8, fontSize: 11, color: "#EDF2F7" }}
                formatter={(val) => [`${val ?? 0}ms`, "Antwortzeit"]}
              />
              <Area type="monotone" dataKey="ms" stroke="#2563E8" strokeWidth={1.5} fill="url(#rtGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ fontSize: 12, color: "#7A8BA6", textAlign: "center", margin: "20px 0" }}>Noch keine Monitoring-Daten</p>
        )}
      </div>

      {/* Konfiguration */}
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0 }}>Konfiguration</p>
          {!editing && (
            <button onClick={() => setEditing(true)}
              style={{ padding: "4px 10px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, fontSize: 11, color: "#EDF2F7", cursor: "pointer" }}>
              Bearbeiten
            </button>
          )}
        </div>

        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))} style={{ background: "none", border: "none", cursor: "pointer", color: form.enabled ? "#10B981" : "#7A8BA6", padding: 0 }}>
                {form.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
              <span style={{ fontSize: 12, color: "#EDF2F7" }}>Monitoring {form.enabled ? "aktiv" : "inaktiv"}</span>
            </div>
            {[
              { label: "Check-URL", key: "checkUrl", type: "text", placeholder: "https://example.com/health" },
              { label: "Intervall (Minuten)", key: "intervalMin", type: "number" },
              { label: "Timeout (Sekunden)", key: "timeoutSec", type: "number" },
              { label: "Erwarteter HTTP-Status", key: "expectedStatus", type: "number" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 10, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 4 }}>{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form] as string | number}
                  placeholder={placeholder}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? +e.target.value : e.target.value }))}
                  style={{ width: "100%", padding: "7px 10px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, color: "#EDF2F7", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(false)} style={{ padding: "6px 12px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, fontSize: 12, color: "#7A8BA6", cursor: "pointer" }}>
                Abbrechen
              </button>
              <button onClick={saveConfig} disabled={saving}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                Speichern
              </button>
            </div>
          </div>
        ) : config ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Status", value: config.enabled ? "Aktiv" : "Deaktiviert", color: config.enabled ? "#10B981" : "#7A8BA6" },
              { label: "Intervall", value: `${config.intervalMin} Minuten` },
              { label: "Timeout", value: `${config.timeoutSec} Sekunden` },
              { label: "Erwarteter Status", value: String(config.expectedStatus) },
              { label: "Check-URL", value: config.checkUrl ?? "—" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ fontSize: 10, color: "#7A8BA6", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: color ?? "#EDF2F7", margin: 0, wordBreak: "break-all" }}>{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: "#7A8BA6", margin: 0 }}>Noch keine Konfiguration. Klicke auf „Bearbeiten", um Monitoring einzurichten.</p>
        )}
      </div>

      {/* Letzte Checks */}
      {checks.length > 0 && (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 10px" }}>Letzte Checks</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {checks.slice(0, 10).map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(30,48,80,0.5)", fontSize: 11 }}>
                {STATUS_ICON[c.status]}
                <span style={{ color: STATUS_COLOR[c.status], minWidth: 70, fontWeight: 600 }}>{c.status}</span>
                <span style={{ color: "#7A8BA6", flex: 1 }}>{fmt(c.checkedAt)}</span>
                {c.responseTime !== null && <span style={{ color: "#EDF2F7", fontVariantNumeric: "tabular-nums", minWidth: 55, textAlign: "right" }}>{c.responseTime}ms</span>}
                {c.statusCode && <span style={{ color: "#4A5B6F", minWidth: 30, textAlign: "right" }}>{c.statusCode}</span>}
                {c.errorMsg && <span style={{ color: "#F87171", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{c.errorMsg}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
