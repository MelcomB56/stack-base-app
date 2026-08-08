"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Plus, X, Loader2 } from "lucide-react";
import { useCan } from "@/lib/permissions-context";

type Incident = {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  autoCreated: boolean;
  startedAt: string | Date;
  resolvedAt: string | Date | null;
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#EAB308", LOW: "#10B981",
};
const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: "Kritisch", HIGH: "Hoch", MEDIUM: "Mittel", LOW: "Niedrig",
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: "Offen", INVESTIGATING: "In Analyse", RESOLVED: "Behoben",
};

function fmt(d: string | Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
}

function duration(start: string | Date, end: string | Date | null) {
  const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h}h ${min % 60}min` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

export function IncidentsTab({ appSlug, initial }: { appSlug: string; initial: Incident[] }) {
  const canCreate = useCan("app_incidents.create");
  const canUpdate = useCan("app_incidents.update");

  const [incidents, setIncidents] = useState<Incident[]>(initial);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSeverity, setNewSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [saving, setSaving] = useState(false);

  async function createIncident() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/apps/${appSlug}/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, description: newDesc, severity: newSeverity }),
    });
    if (res.ok) {
      const inc = await res.json();
      setIncidents((p) => [inc, ...p]);
      setShowNew(false);
      setNewTitle("");
      setNewDesc("");
    }
    setSaving(false);
  }

  async function resolve(id: string) {
    const res = await fetch(`/api/apps/${appSlug}/incidents?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIncidents((p) => p.map((i) => i.id === id ? updated : i));
    }
  }

  async function setInvestigating(id: string) {
    const res = await fetch(`/api/apps/${appSlug}/incidents?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "INVESTIGATING" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIncidents((p) => p.map((i) => i.id === id ? updated : i));
    }
  }

  const open = incidents.filter((i) => i.status !== "RESOLVED");
  const resolved = incidents.filter((i) => i.status === "RESOLVED");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 11, fontWeight: 600 }}>
            {open.length} offen
          </span>
          <span style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#34D399", fontSize: 11, fontWeight: 600 }}>
            {resolved.length} behoben
          </span>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowNew(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={12} /> Incident melden
          </button>
        )}
      </div>

      {/* Neues Incident Formular */}
      {canCreate && showNew && (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>Neues Incident</p>
            <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", color: "#7A8BA6", cursor: "pointer", padding: 2 }}>
              <X size={14} />
            </button>
          </div>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titel"
            style={{ padding: "8px 12px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 8, color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit" }}
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Beschreibung (optional)"
            rows={3}
            style={{ padding: "8px 12px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 8, color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((s) => (
              <button key={s} onClick={() => setNewSeverity(s)}
                style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${SEVERITY_COLOR[s]}55`, color: SEVERITY_COLOR[s], background: newSeverity === s ? `${SEVERITY_COLOR[s]}22` : "transparent", transition: "background 150ms" }}>
                {SEVERITY_LABEL[s]}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={createIncident}
              disabled={!newTitle.trim() || saving}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: !newTitle.trim() || saving ? "not-allowed" : "pointer", opacity: !newTitle.trim() || saving ? 0.5 : 1 }}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : null}
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Offene Incidents */}
      {open.length === 0 && !showNew && (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 32, textAlign: "center" }}>
          <CheckCircle size={32} style={{ color: "#10B981", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, color: "#34D399", margin: 0, fontWeight: 600 }}>Keine offenen Incidents</p>
        </div>
      )}

      {open.map((inc) => (
        <div key={inc.id} style={{ background: "#111C2D", border: `1px solid ${SEVERITY_COLOR[inc.severity]}44`, borderLeft: `3px solid ${SEVERITY_COLOR[inc.severity]}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <AlertTriangle size={13} style={{ color: SEVERITY_COLOR[inc.severity], flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>{inc.title}</span>
                <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600, background: `${SEVERITY_COLOR[inc.severity]}22`, color: SEVERITY_COLOR[inc.severity], border: `1px solid ${SEVERITY_COLOR[inc.severity]}44` }}>
                  {SEVERITY_LABEL[inc.severity]}
                </span>
                <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 10, background: "#1A2640", color: "#7A8BA6" }}>
                  {STATUS_LABEL[inc.status]}
                </span>
                {inc.autoCreated && (
                  <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 10, background: "rgba(124,58,237,0.1)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.2)" }}>auto</span>
                )}
              </div>
              {inc.description && <p style={{ fontSize: 12, color: "#7A8BA6", margin: "0 0 6px 21px" }}>{inc.description}</p>}
              <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#7A8BA6", marginLeft: 21 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={9} /> {fmt(inc.startedAt)}</span>
                <span>Dauer: {duration(inc.startedAt, null)}</span>
              </div>
            </div>
            {canUpdate && (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {inc.status === "OPEN" && (
                  <button onClick={() => setInvestigating(inc.id)}
                    style={{ padding: "4px 10px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, fontSize: 11, color: "#EDF2F7", cursor: "pointer" }}>
                    Analysieren
                  </button>
                )}
                <button onClick={() => resolve(inc.id)}
                  style={{ padding: "4px 10px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 7, fontSize: 11, color: "#34D399", cursor: "pointer" }}>
                  Beheben
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Behobene */}
      {resolved.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#7A8BA6", margin: 0 }}>Behoben</p>
          {resolved.slice(0, 5).map((inc) => (
            <div key={inc.id} style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle size={12} style={{ color: "#34D399", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#7A8BA6", flex: 1 }}>{inc.title}</span>
              <span style={{ fontSize: 10, color: "#4A5B6F" }}>{fmt(inc.resolvedAt)}</span>
              <span style={{ fontSize: 10, color: "#4A5B6F" }}>({duration(inc.startedAt, inc.resolvedAt)})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
