"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Cpu, MemoryStick, RefreshCw, ArrowDownUp, AlertCircle, Settings, Copy, Check } from "lucide-react";
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
  agentUrl: string | null;
  dockerHost: string | null;
  dockerContainer: string | null;
  metricsUrl: string | null;
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

type AgentStatus = "unknown" | "ok" | "error";

export function ResourceTab({ slug }: { slug: string }) {
  const [data, setData] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("unknown");
  const [agentLatency, setAgentLatency] = useState<number | null>(null);

  const load = useCallback(async (): Promise<ResourceData | null> => {
    try {
      const res = await fetch(`/api/apps/${slug}/resources`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d: ResourceData = await res.json();
      setData(d);
      setError(null);
      return d;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    const t0 = Date.now();
    try {
      const res = await fetch(`/api/apps/${slug}/resources`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setAgentStatus("ok");
      setAgentLatency(Date.now() - t0);
      await load();
    } catch (e) {
      setAgentStatus("error");
      setAgentLatency(null);
      if (!silent) setError(String(e));
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, [slug, load]);

  // Beim Mount: Daten laden, dann Agent automatisch abfragen wenn konfiguriert
  useEffect(() => {
    load().then((d) => {
      if (d?.agentUrl || d?.dockerHost || d?.metricsUrl) refresh(true);
    });
  }, [load, refresh]);

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

  const hasConfig = data?.agentUrl || (data?.dockerHost && data?.dockerContainer) || data?.metricsUrl;
  if (!hasConfig) {
    return (
      <div style={{
        background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12,
        padding: 28, display: "flex", flexDirection: "column", gap: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Settings size={28} style={{ opacity: 0.35, flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#EDF2F7" }}>Kein Agent konfiguriert</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7A8BA6" }}>
              Deploye den Stack-Base Agent auf deinem Server — funktioniert für Docker und Non-Docker, intern und extern.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Step n={1} title="Agent deployen">
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#7A8BA6" }}>
              <strong style={{ color: "#EDF2F7" }}>Variante A</strong> — Container-Monitoring (überwacht einen spezifischen Container):
            </p>
            <CopyCode text={`docker run -d --name stackbase-agent \\
  -p 9101:9101 \\
  -e SB_CONTAINER=dein-container \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  ghcr.io/melcomb56/stackbase-agent:latest`} />
            <p style={{ margin: "10px 0 6px", fontSize: 12, color: "#7A8BA6" }}>
              <strong style={{ color: "#EDF2F7" }}>Variante B</strong> — Nur Host-System-Metriken (CPU/RAM/Netzwerk des Servers):
            </p>
            <CopyCode text="docker run -d --name stackbase-agent -p 9101:9101 ghcr.io/melcomb56/stackbase-agent:latest" />
            <p style={{ margin: "10px 0 6px", fontSize: 12, color: "#7A8BA6" }}>
              <strong style={{ color: "#EDF2F7" }}>Variante C</strong> — Natives Binary (ohne Docker):
            </p>
            <CopyCode text={`curl -L https://github.com/MelcomB56/stack-base-app/releases/latest/download/stackbase-agent-linux-amd64 \\
  -o stackbase-agent && chmod +x stackbase-agent
SB_API_KEY=mein-token ./stackbase-agent`} />
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#4A5B6F" }}>
              Als systemd-Dienst: Vollständige Anleitung unter <span style={{ color: "#2563E8" }}>Docs → Stack-Base Agent einrichten</span>.
            </p>
          </Step>

          <Step n={2} title="Token ablesen">
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#7A8BA6" }}>
              Der Agent gibt beim Start den Token aus: <code style={{ background: "#0B1220", padding: "1px 6px", borderRadius: 4, fontSize: 11, color: "#EDF2F7" }}>sb_xxxxxxxxxxxx...</code>
            </p>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#4A5B6F" }}>Variante A / B (Docker):</p>
            <CopyCode text="docker logs stackbase-agent" />
            <p style={{ margin: "6px 0 4px", fontSize: 11, color: "#4A5B6F" }}>Variante C (systemd):</p>
            <CopyCode text="journalctl -u stackbase-agent | grep Token" />
          </Step>

          <Step n={3} title="Agent-URL + Token eintragen">
            <p style={{ margin: 0, fontSize: 12, color: "#7A8BA6" }}>
              Oben rechts:{" "}
              <strong style={{ color: "#EDF2F7" }}>Aktionen &rarr; Bearbeiten</strong>
              {" → Abschnitt 'Ressourcen-Monitoring' → Agent-URL + Token eingeben und speichern."}
            </p>
          </Step>
        </div>
      </div>
    );
  }

  const l = data.latest;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {data.agentUrl ? (
            <p style={{ margin: 0, fontSize: 12, color: "#7A8BA6" }}>
              Stack-Base Agent: <code style={{ color: "#EDF2F7" }}>{data.agentUrl}</code>
            </p>
          ) : data.metricsUrl ? (
            <p style={{ margin: 0, fontSize: 12, color: "#7A8BA6" }}>
              Metrics-URL: <code style={{ color: "#EDF2F7" }}>{data.metricsUrl}</code>
            </p>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 12, color: "#7A8BA6" }}>
                Docker Host: <code style={{ color: "#EDF2F7" }}>{data.dockerHost}</code>
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#7A8BA6" }}>
                Container: <code style={{ color: "#EDF2F7" }}>{data.dockerContainer}</code>
              </p>
            </>
          )}
          <AgentStatusBadge status={agentStatus} latency={agentLatency} />
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

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(37,99,232,0.15)", border: "1px solid rgba(37,99,232,0.3)", color: "#2563E8", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {n}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#EDF2F7" }}>{title}</p>
        {children}
      </div>
    </div>
  );
}

function CopyCode({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ position: "relative" }}>
      <pre style={{ margin: 0, padding: "8px 40px 8px 10px", background: "#0B1220", border: "1px solid #1E3050", borderRadius: 6, fontSize: 11, fontFamily: "monospace", color: "#EDF2F7", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {text}
      </pre>
      <button
        onClick={copy}
        style={{ position: "absolute", top: 6, right: 6, padding: "2px 4px", background: "transparent", border: "none", cursor: "pointer", color: copied ? "#10B981" : "#7A8BA6" }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

function AgentStatusBadge({ status, latency }: { status: AgentStatus; latency: number | null }) {
  const cfg = {
    unknown: { color: "#7A8BA6", bg: "rgba(122,139,166,0.1)", border: "rgba(122,139,166,0.2)", dot: "#7A8BA6", label: "Status unbekannt" },
    ok:      { color: "#10B981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)", dot: "#10B981", label: latency ? `Erreichbar · ${latency} ms` : "Erreichbar" },
    error:   { color: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)", dot: "#EF4444", label: "Nicht erreichbar" },
  }[status];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, width: "fit-content" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0, boxShadow: status === "ok" ? `0 0 6px ${cfg.dot}` : "none" }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, letterSpacing: ".02em" }}>{cfg.label}</span>
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
            formatter={(v) => {
              const n = typeof v === "number" ? v : 0;
              return [`${n.toFixed(1)}${unit}`, dataKey === "cpu" ? "CPU" : "RAM"];
            }}
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
