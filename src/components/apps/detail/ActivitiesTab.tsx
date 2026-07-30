"use client";

import { useState, useCallback } from "react";
import { GitBranch, FileText, AlertTriangle, BookOpen, RefreshCw, Activity, Pencil, Trash2, CheckCircle, Shield, ChevronDown } from "lucide-react";

type ActivityLog = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string } | null;
};

interface Props {
  appSlug: string;
  initial: ActivityLog[];
  initialCursor: string | null;
}

// ── Action-Metadaten ──────────────────────────────────────────────────────────

type ActionMeta = {
  icon: React.ReactNode;
  color: string;
  label: (meta: Record<string, unknown>, action?: string) => string;
};

const ACTION_MAP: Record<string, ActionMeta> = {
  "release.created":   { icon: <GitBranch size={13} />, color: "#10B981", label: (m) => `Release v${m.version ?? "?"} angelegt` },
  "release.updated":   { icon: <Pencil size={13} />,    color: "#3B82F6", label: (m) => `Release v${m.version ?? "?"} aktualisiert` },
  "release.deleted":   { icon: <Trash2 size={13} />,    color: "#F87171", label: (m) => `Release v${m.version ?? "?"} gelöscht` },
  "changelog.created": { icon: <FileText size={13} />,  color: "#A78BFA", label: (m) => `Changelog-Eintrag angelegt (${m.type ?? "?"})` },
  "changelog.deleted": { icon: <Trash2 size={13} />,    color: "#F87171", label: (m) => `Changelog-Eintrag gelöscht (${m.type ?? "?"})` },
  "incident.created":  { icon: <AlertTriangle size={13} />, color: "#F59E0B", label: (m) => `Incident eröffnet: ${m.title ?? "?"}` },
  "incident.resolved": { icon: <CheckCircle size={13} />,   color: "#10B981", label: (m) => `Incident abgeschlossen: ${m.title ?? "?"}` },
  "incident.updated":  { icon: <Pencil size={13} />,        color: "#3B82F6", label: (m) => `Incident aktualisiert: ${m.title ?? "?"}` },
  "doc.created":       { icon: <BookOpen size={13} />,  color: "#22D3EE", label: (m) => `Dokument erstellt: ${m.title ?? "?"}` },
  "doc.updated":       { icon: <Pencil size={13} />,    color: "#3B82F6", label: (m) => `Dokument aktualisiert: ${m.title ?? "?"}` },
  "doc.deleted":       { icon: <Trash2 size={13} />,    color: "#F87171", label: (m) => `Dokument gelöscht: ${m.title ?? "?"}` },
  "github.synced":     { icon: <RefreshCw size={13} />, color: "#10B981", label: (m) => `GitHub-Sync: ${m.imported ?? 0} Releases importiert` },
  "status.changed":    { icon: <Activity size={13} />,  color: "#F59E0B", label: (m) => `Status geändert: ${m.oldStatus ?? "?"} → ${m.newStatus ?? "?"}` },
  "app.created":       { icon: <Shield size={13} />,    color: "#2563E8", label: () => "App angelegt" },
  "app.updated":       { icon: <Pencil size={13} />,    color: "#3B82F6", label: () => "App-Daten aktualisiert" },
};

const FALLBACK: ActionMeta = {
  icon: <Activity size={13} />,
  color: "#7A8BA6",
  label: (_meta, action) => action ?? "Unbekannte Aktion",
};

function getMeta(action: string) {
  return ACTION_MAP[action] ?? FALLBACK;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "gerade eben";
  const m = Math.floor(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 30) return `vor ${d} Tagen`;
  return new Date(iso).toLocaleDateString("de-DE");
}

export function ActivitiesTab({ appSlug, initial, initialCursor }: Props) {
  const [logs, setLogs] = useState<ActivityLog[]>(initial);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/apps/${appSlug}/activity?cursor=${cursor}`);
      const data = await res.json();
      setLogs((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [appSlug, cursor, loading]);

  if (logs.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "60px 0", color: "#7A8BA6" }}>
        <Activity size={32} style={{ opacity: 0.3 }} />
        <p style={{ margin: 0, fontSize: 14 }}>Noch keine Aktivitäten aufgezeichnet.</p>
        <p style={{ margin: 0, fontSize: 12 }}>Neue Einträge erscheinen automatisch bei jeder Änderung.</p>
      </div>
    );
  }

  // Nach Datum gruppieren
  const groups: { label: string; items: ActivityLog[] }[] = [];
  let currentLabel = "";
  for (const log of logs) {
    const d = new Date(log.createdAt);
    const label = d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, items: [] });
    }
    groups[groups.length - 1].items.push(log);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {groups.map((group) => (
        <div key={group.label}>
          {/* Datums-Trenner */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 10px" }}>
            <div style={{ flex: 1, height: 1, background: "#1E3050" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{group.label}</span>
            <div style={{ flex: 1, height: 1, background: "#1E3050" }} />
          </div>

          {/* Einträge */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {group.items.map((log, i) => {
              const meta = getMeta(log.action);
              const label = meta.label(log.metadata ?? {}, log.action);
              const isLast = i === group.items.length - 1;
              return (
                <div key={log.id} style={{ display: "flex", gap: 12, position: "relative" }}>
                  {/* Verbindungslinie */}
                  {!isLast && (
                    <div style={{ position: "absolute", left: 15, top: 28, bottom: -2, width: 1, background: "#1E3050" }} />
                  )}
                  {/* Icon-Dot */}
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: `${meta.color}18`, border: `1px solid ${meta.color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: meta.color, marginTop: 2,
                  }}>
                    {meta.icon}
                  </div>
                  {/* Text */}
                  <div style={{ flex: 1, padding: "4px 0 14px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                      {log.user && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7" }}>{log.user.name}</span>
                      )}
                      <span style={{ fontSize: 12, color: "#C8D8E8" }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#7A8BA6" }}>{timeAgo(log.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Mehr laden */}
      {cursor && (
        <div style={{ textAlign: "center", paddingTop: 12 }}>
          <button
            onClick={loadMore}
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 8, background: "#111C2D", border: "1px solid #1E3050", color: "#7A8BA6", fontSize: 12, cursor: loading ? "not-allowed" : "pointer" }}
          >
            <ChevronDown size={13} />
            {loading ? "Lädt…" : "Ältere laden"}
          </button>
        </div>
      )}
    </div>
  );
}
