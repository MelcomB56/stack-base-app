"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Play, Square, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";

type JobInfo = {
  name: string;
  label: string;
  startedAt: string | null;
  finishedAt: string | null;
  status: "running" | "success" | "error" | "never";
  itemCount: number | null;
  error: string | null;
};

type WorkerStatus = {
  status: "online" | "offline";
  lastPing: string | null;
  startedAt: string | null;
  checksRun: number;
  pid: number | null;
  ageSeconds?: number | null;
  jobs: JobInfo[];
};

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 5) return "gerade eben";
  if (sec < 60) return `vor ${sec}s`;
  if (sec < 3600) return `vor ${Math.floor(sec / 60)}min`;
  if (sec < 86400) return `vor ${Math.floor(sec / 3600)}h`;
  return `vor ${Math.floor(sec / 86400)}d`;
}

function fmtDe(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "medium" }).format(new Date(iso));
}

function JobStatusIcon({ status }: { status: JobInfo["status"] }) {
  if (status === "success") return <CheckCircle2 size={13} style={{ color: "#10B981", flexShrink: 0 }} />;
  if (status === "error") return <XCircle size={13} style={{ color: "#EF4444", flexShrink: 0 }} />;
  if (status === "running") return <Loader2 size={13} style={{ color: "#F59E0B", flexShrink: 0, animation: "spin 1s linear infinite" }} />;
  return <Clock size={13} style={{ color: "#4A5B6F", flexShrink: 0 }} />;
}

const JOB_SCHEDULE: Record<string, string> = {
  healthcheck:     "alle 5 Min",
  certcheck:       "tägl. 03:00",
  resourcemonitor: "alle 5 Min",
};

export function WorkerStatusCard() {
  const [data, setData] = useState<WorkerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);

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
      setActionMsg(res.ok ? json.message : `Fehler: ${json.error}`);
      setTimeout(fetchStatus, action === "start" ? 3000 : 500);
    } catch {
      setActionMsg("Netzwerkfehler");
    } finally {
      setActing(false);
    }
  }

  async function triggerJob(jobName: string) {
    setTriggering(jobName);
    setActionMsg(null);
    try {
      const res = await fetch("/api/system/worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger", job: jobName }),
      });
      const json = await res.json();
      setActionMsg(res.ok ? `${json.message} — Ergebnis erscheint in ~30s` : `Fehler: ${json.error}`);
      setTimeout(fetchStatus, 5000);
    } catch {
      setActionMsg("Netzwerkfehler");
    } finally {
      setTriggering(null);
    }
  }

  const online = data?.status === "online";
  const dotColor = loading ? "#4B5563" : online ? "#10B981" : "#EF4444";
  const statusLabel = loading ? "…" : online ? "Online" : "Offline";

  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <Activity size={11} />
          Monitoring-Worker
        </p>
        <button onClick={fetchStatus} disabled={loading} title="Status aktualisieren"
          style={{ background: "none", border: "none", color: "#7A8BA6", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
          <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {/* Prozess-Status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#0B1220", borderRadius: 10, border: "1px solid #1E3050" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ position: "relative", width: 10, height: 10, display: "inline-block" }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: dotColor, animation: online ? "pulse 2s infinite" : "none", opacity: 0.4 }} />
            <span style={{ position: "absolute", inset: 2, borderRadius: "50%", background: dotColor }} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: online ? "#10B981" : "#EF4444" }}>{statusLabel}</span>
          {data?.pid && online && <span style={{ fontSize: 11, color: "#7A8BA6" }}>PID {data.pid}</span>}
          {data?.lastPing && (
            <span style={{ fontSize: 11, color: "#4A5B6F" }}>Ping {timeAgo(data.lastPing)}</span>
          )}
        </div>
        <button
          onClick={() => doAction(online ? "stop" : "start")}
          disabled={acting || loading}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 500,
            background: online ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
            color: online ? "#F87171" : "#10B981",
            border: `1px solid ${online ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
            cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1,
          }}>
          {acting ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : online ? <Square size={11} /> : <Play size={11} />}
          {acting ? "…" : online ? "Stoppen" : "Starten"}
        </button>
      </div>

      {/* Meta */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Gestartet", value: data.startedAt ? fmtDe(data.startedAt) : "—" },
            { label: "Letzter Ping", value: data.lastPing ? timeAgo(data.lastPing) : "—" },
            { label: "Checks gesamt", value: data.checksRun.toLocaleString("de-DE") },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: 10, color: "#7A8BA6", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Job-Tabelle */}
      <div style={{ borderTop: "1px solid #1E3050", paddingTop: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 10px" }}>
          Jobs
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(data?.jobs ?? [
            { name: "healthcheck", label: "Healthcheck", startedAt: null, finishedAt: null, status: "never" as const, itemCount: null, error: null },
            { name: "certcheck", label: "Zertifikat-Check", startedAt: null, finishedAt: null, status: "never" as const, itemCount: null, error: null },
            { name: "resourcemonitor", label: "Resource-Monitor", startedAt: null, finishedAt: null, status: "never" as const, itemCount: null, error: null },
          ]).map((job) => (
            <div key={job.name} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", background: "#0B1220", borderRadius: 8,
              border: `1px solid ${job.status === "error" ? "rgba(239,68,68,0.3)" : "#1E3050"}`,
            }}>
              <JobStatusIcon status={job.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7" }}>{job.label}</span>
                  <span style={{ fontSize: 10, color: "#4A5B6F", background: "#111C2D", padding: "1px 6px", borderRadius: 4, border: "1px solid #1E3050" }}>
                    {JOB_SCHEDULE[job.name]}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#7A8BA6", marginTop: 2 }}>
                  {job.status === "never" && "Noch nie ausgeführt"}
                  {job.status === "running" && "Läuft gerade…"}
                  {(job.status === "success" || job.status === "error") && job.startedAt && (
                    <>
                      Letzter Lauf {timeAgo(job.startedAt)}
                      {job.itemCount !== null && ` · ${job.itemCount} Einträge`}
                      {job.finishedAt && job.startedAt && (
                        ` · ${((new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime()) / 1000).toFixed(1)}s`
                      )}
                    </>
                  )}
                  {job.status === "error" && job.error && (
                    <span style={{ color: "#FCA5A5", display: "block", marginTop: 2, fontSize: 10 }}>{job.error}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => triggerJob(job.name)}
                disabled={triggering === job.name || job.status === "running"}
                title="Jetzt ausführen"
                style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                  background: "rgba(37,99,232,0.1)", border: "1px solid rgba(37,99,232,0.25)",
                  color: "#2563E8", borderRadius: 6, fontSize: 11, cursor: "pointer",
                  opacity: (triggering === job.name || job.status === "running") ? 0.5 : 1,
                  flexShrink: 0,
                }}>
                {triggering === job.name
                  ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                  : <Zap size={10} />}
                <span>Ausführen</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {actionMsg && (
        <p style={{ margin: 0, fontSize: 11, color: "#7A8BA6", borderTop: "1px solid #1E3050", paddingTop: 10 }}>
          {actionMsg}
        </p>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(2); opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
