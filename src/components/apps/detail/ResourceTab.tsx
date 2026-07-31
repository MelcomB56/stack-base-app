"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Cpu, MemoryStick, RefreshCw, ArrowDownUp, AlertCircle, Settings } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Reading {
  id: string;
  appId: string;
  cpuPercent: number | null;
  memPercent: number | null;
  memUsed: string | null;
  memLimit: string | null;
  netIn: string | null;
  netOut: string | null;
  readAt: string;
}

interface HistoryPoint {
  readAt: string;
  cpuPercent: number | null;
  memPercent: number | null;
  memUsed: string | null;
  memLimit: string | null;
}

interface ResourceData {
  latest: Reading | null;
  history: HistoryPoint[];
  dockerHost: string | null;
  dockerContainer: string | null;
}

function formatBytes(bytes: string | null): string {
  if (!bytes) return "—";
  const n = Number(bytes);
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function pctColor(pct: number): string {
  if (pct >= 90) return "#EF4444";
  if (pct >= 70) return "#F59E0B";
  return "#10B981";
}

function GaugeBar({ value, label, color }: { value: number | null; label: string; color: string }) {
  const pct = value ?? 0;
  const clr = pctColor(pct);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#7A8BA6" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: clr, fontVariantNumeric: "tabular-nums" }}>
          {value !== null ? `${pct.toFixed(1)}%` : "—"}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "#0B1220", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${Math.min(pct, 100)}%`,
            background: clr,
            borderRadius: 4,
            transition: "width 600ms ease",
          }}
        />
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "#111C2D",
  border: "1px solid #1E3050",
  borderRadius: 8,
  fontSize: 12,
  color: "#EDF2F7",
};

export function ResourceTab({ slug }: { slug: string }) {
  const [data, setData] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${slug}/resources`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  async function refresh() {
    if (!data?.dockerHost || !data?.dockerContainer) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/apps/${slug}/resources`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setRefreshing(false);
    }
  }

  const chartData = (data?.history ?? []).map((p) => ({
    time: formatTime(p.readAt),
    cpu: p.cpuPercent !== null ? parseFloat(p.cpuPercent.toFixed(2)) : null,
    mem: p.memPercent !== null ? parseFloat(p.memPercent.toFixed(2)) : null,
  }));

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 32, color: "#7A8BA6" }}>
        <Activity size={16} /> Lade Ressourcen…
      </div>
    );
  }

  if (!data?.dockerHost || !data?.dockerContainer) {
    return (
      <div style={{
        background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12,
        padding: 32, display: "flex", flexDirection: "column", alignItems: "center",
        gap: 12, color: "#7A8BA6", textAlign: "center",
      }}>
        <Settings size={32} style={{ opacity: 0.4 }} />
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: "#EDF2F7" }}>Kein Container konfiguriert</p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            Trage <strong>Docker-Host</strong> und <strong>Container-Name</strong> in den App-Einstellungen ein,
            um Ressourcen zu überwachen.
          </p>
        </div>
      </div>
    );
  }

  const l = data.latest;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "#7A8BA6" }}>
            Host: <code style={{ color: "#EDF2F7" }}>{data.dockerHost}</code>
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#7A8BA6" }}>
            Container: <code style={{ color: "#EDF2F7" }}>{data.dockerContainer}</code>
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 8, fontSize: 13,
            background: "rgba(37,99,232,0.15)", border: "1px solid rgba(37,99,232,0.3)",
            color: "#2563E8", cursor: refreshing ? "wait" : "pointer",
          }}
        >
          <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          {refreshing ? "Prüfe…" : "Jetzt abfragen"}
        </button>
      </div>

      {error && (
        <div style={{
          display: "flex", gap: 8, padding: "10px 14px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 8, color: "#FCA5A5", fontSize: 13,
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      {/* Aktuelle Werte */}
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 20 }}>
        <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#7A8BA6" }}>
          Aktuelle Auslastung
          {l && (
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 8, color: "#4A5B6F" }}>
              — {new Date(l.readAt).toLocaleString("de-DE")}
            </span>
          )}
        </p>

        {!l ? (
          <p style={{ color: "#7A8BA6", fontSize: 13, margin: 0 }}>Noch keine Daten. Klicke "Jetzt abfragen".</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 20 }}>
              <GaugeBar value={l.cpuPercent} label="CPU" color="#2563E8" />
              <GaugeBar value={l.memPercent} label="RAM" color="#8B5CF6" />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <StatChip icon={<Cpu size={13} />} label="CPU" value={l.cpuPercent !== null ? `${l.cpuPercent.toFixed(2)} %` : "—"} />
              <StatChip icon={<MemoryStick size={13} />} label="RAM" value={l.memUsed ? `${formatBytes(l.memUsed)} / ${formatBytes(l.memLimit)}` : "—"} />
              <StatChip icon={<ArrowDownUp size={13} />} label="Netz I/O" value={l.netIn ? `↓ ${formatBytes(l.netIn)} ↑ ${formatBytes(l.netOut)}` : "—"} />
            </div>
          </div>
        )}
      </div>

      {/* Sparklines */}
      {chartData.length > 1 && (
        <div style={{ display: "flex", gap: 12 }}>
          <SparkCard title="CPU (24h)" dataKey="cpu" data={chartData} color="#2563E8" unit="%" />
          <SparkCard title="RAM (24h)" dataKey="mem" data={chartData} color="#8B5CF6" unit="%" />
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      flex: 1, background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8,
      padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#7A8BA6", fontSize: 11 }}>
        {icon} {label}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
    </div>
  );
}

function SparkCard({
  title, dataKey, data, color, unit,
}: {
  title: string;
  dataKey: "cpu" | "mem";
  data: { time: string; cpu: number | null; mem: number | null }[];
  color: string;
  unit: string;
}) {
  return (
    <div style={{ flex: 1, background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "#7A8BA6", fontWeight: 600 }}>{title}</p>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 2, right: 2, left: -32, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#4A5B6F" }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#4A5B6F" }} tickFormatter={(v) => `${v}${unit}`} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number) => [`${v.toFixed(1)}${unit}`, dataKey === "cpu" ? "CPU" : "RAM"]}
            labelStyle={{ color: "#7A8BA6" }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${dataKey})`}
            connectNulls
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
