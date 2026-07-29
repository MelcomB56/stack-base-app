"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Play, Square, RefreshCw, Loader2 } from "lucide-react";

type WorkerStatus = {
  status: "online" | "offline";
  lastPing: string | null;
  startedAt: string | null;
  checksRun: number;
  pid: number | null;
  ageSeconds?: number;
};

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `vor ${sec}s`;
  if (sec < 3600) return `vor ${Math.floor(sec / 60)}min`;
  return `vor ${Math.floor(sec / 3600)}h`;
}

function fmtDe(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "medium" }).format(new Date(iso));
}

export function WorkerStatusCard() {
  const [data, setData] = useState<WorkerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/system/worker");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 30_000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  async function doAction(action: "start" | "stop") {
    setActing(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/system/worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionMsg(`Fehler: ${json.error}`);
      } else {
        setActionMsg(json.message);
        // Status nach kurzer Verzögerung neu laden (Worker braucht ~2s zum Starten)
        setTimeout(fetchStatus, action === "start" ? 3000 : 500);
      }
    } catch {
      setActionMsg("Netzwerkfehler");
    } finally {
      setActing(false);
    }
  }

  const online = data?.status === "online";
  const dotColor = loading ? "#4B5563" : online ? "#10B981" : "#EF4444";
  const statusLabel = loading ? "…" : online ? "Online" : "Offline";

  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <Activity size={11} />
          Monitoring-Worker
        </p>
        <button onClick={fetchStatus} disabled={loading} title="Status aktualisieren"
          style={{ background: "none", border: "none", color: "#7A8BA6", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Status-Zeile */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Pulsierender Dot */}
          <span style={{ position: "relative", width: 10, height: 10, display: "inline-block" }}>
            <span style={{
              position: "absolute", inset: 0, borderRadius: "50%", background: dotColor,
              animation: online ? "pulse 2s infinite" : "none", opacity: 0.4,
            }} />
            <span style={{ position: "absolute", inset: 2, borderRadius: "50%", background: dotColor }} />
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: online ? "#10B981" : "#EF4444" }}>{statusLabel}</span>
          {data?.pid && online && (
            <span style={{ fontSize: 11, color: "#7A8BA6" }}>PID {data.pid}</span>
          )}
        </div>

        {/* Start/Stop-Button */}
        <button
          onClick={() => doAction(online ? "stop" : "start")}
          disabled={acting || loading}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 500,
            background: online ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
            color: online ? "#F87171" : "#10B981",
            border: `1px solid ${online ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
            cursor: acting ? "not-allowed" : "pointer",
            opacity: acting ? 0.6 : 1,
          }}>
          {acting
            ? <Loader2 size={11} className="animate-spin" />
            : online ? <Square size={11} /> : <Play size={11} />}
          {acting ? "…" : online ? "Stoppen" : "Starten"}
        </button>
      </div>

      {/* Meta-Infos */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, borderTop: "1px solid #1E3050", paddingTop: 12 }}>
          {[
            { label: "Letzter Ping", value: data.lastPing ? timeAgo(data.lastPing) : "—" },
            { label: "Gestartet", value: data.startedAt ? fmtDe(data.startedAt) : "—" },
            { label: "Checks gesamt", value: data.checksRun.toLocaleString("de-DE") },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: 10, color: "#7A8BA6", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Aktions-Feedback */}
      {actionMsg && (
        <p style={{ margin: 0, fontSize: 11, color: "#7A8BA6", borderTop: "1px solid #1E3050", paddingTop: 10 }}>
          {actionMsg}
        </p>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(2); opacity: 0; } }
      `}</style>
    </div>
  );
}
