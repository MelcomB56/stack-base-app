"use client";

import { useState, useTransition } from "react";
import { RefreshCw, ShieldCheck, ShieldAlert, ShieldX, Shield, AlertTriangle, ExternalLink } from "lucide-react";
import { useCan } from "@/lib/permissions-context";

interface CertCheck {
  id: string;
  domain: string;
  validFrom: string | null;
  validTo: string | null;
  issuer: string | null;
  subject: string | null;
  daysLeft: number | null;
  status: string;
  errorMsg: string | null;
  checkedAt: string;
}

interface HistoryEntry {
  id: string;
  status: string;
  daysLeft: number | null;
  checkedAt: string;
  errorMsg: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  VALID:         { label: "Gültig",          color: "#10B981", icon: <ShieldCheck size={16} /> },
  EXPIRING_SOON: { label: "Läuft bald ab",   color: "#F59E0B", icon: <ShieldAlert size={16} /> },
  EXPIRED:       { label: "Abgelaufen",      color: "#EF4444", icon: <ShieldX size={16} /> },
  ERROR:         { label: "Fehler",          color: "#F97316", icon: <AlertTriangle size={16} /> },
  UNKNOWN:       { label: "Unbekannt",       color: "#6B7280", icon: <Shield size={16} /> },
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function DaysBar({ daysLeft }: { daysLeft: number | null }) {
  if (daysLeft === null) return null;
  const total = 365;
  const pct = Math.max(0, Math.min(100, (daysLeft / total) * 100));
  const color = daysLeft < 0 ? "#EF4444" : daysLeft < 30 ? "#F59E0B" : "#10B981";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 6, background: "#1A2640", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 400ms" }} />
      </div>
      <p style={{ fontSize: 10, color: "#7A8BA6", marginTop: 4, margin: "4px 0 0" }}>
        {daysLeft < 0 ? `Seit ${Math.abs(daysLeft)} Tagen abgelaufen` : `Noch ${daysLeft} Tage gültig (von 365)`}
      </p>
    </div>
  );
}

export function CertTab({ appSlug, urlProd }: { appSlug: string; urlProd: string | null }) {
  const canCheck = useCan("app_certs.update");

  const [data, setData] = useState<{ latest: CertCheck | null; history: HistoryEntry[]; urlProd: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, startCheck] = useTransition();
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/apps/${appSlug}/cert`);
    if (res.ok) setData(await res.json());
    setLoading(false);
    setLoaded(true);
  }

  function triggerCheck() {
    startCheck(async () => {
      const res = await fetch(`/api/apps/${appSlug}/cert`, { method: "POST" });
      if (res.ok) {
        const r = await res.json();
        setData((prev) => prev
          ? { ...prev, latest: r.latest, history: [{ id: r.latest.id, status: r.latest.status, daysLeft: r.latest.daysLeft, checkedAt: r.latest.checkedAt, errorMsg: r.latest.errorMsg }, ...prev.history].slice(0, 20) }
          : prev
        );
      }
    });
  }

  // Auto-load on mount
  if (!loaded && !loading) load();

  const meta = data?.latest ? STATUS_META[data.latest.status] ?? STATUS_META.UNKNOWN : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header + Trigger */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>SSL/TLS-Zertifikat</p>
          {urlProd && (
            <a href={urlProd} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: "#7A8BA6", display: "flex", alignItems: "center", gap: 4, marginTop: 2, textDecoration: "none" }}>
              {urlProd} <ExternalLink size={10} />
            </a>
          )}
        </div>
        {canCheck && (
          <button
            onClick={triggerCheck}
            disabled={checking || !urlProd}
            title={!urlProd ? "Keine Production-URL konfiguriert" : undefined}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              background: checking ? "#1A2640" : "#2563E8",
              border: "none", borderRadius: 7, color: checking ? "#7A8BA6" : "#fff",
              fontSize: 12, fontWeight: 600, cursor: urlProd ? "pointer" : "not-allowed",
            }}
          >
            <RefreshCw size={12} style={{ animation: checking ? "spin 1s linear infinite" : "none" }} />
            {checking ? "Prüfe..." : "Jetzt prüfen"}
          </button>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#7A8BA6", fontSize: 13 }}>Lade Zertifikat-Daten…</div>
      )}

      {!urlProd && !loading && (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 10, padding: 20, textAlign: "center" }}>
          <Shield size={28} style={{ color: "#7A8BA6", marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: "#7A8BA6", margin: 0 }}>Keine Production-URL konfiguriert.</p>
          <p style={{ fontSize: 11, color: "#7A8BA6", margin: "4px 0 0" }}>Trage eine URL im Übersicht-Tab ein.</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Current status card */}
          <div style={{
            background: "#111C2D",
            border: `1px solid ${meta ? meta.color + "44" : "#1E3050"}`,
            borderRadius: 12, padding: 20,
          }}>
            {!data.latest ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <Shield size={28} style={{ color: "#7A8BA6", marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: "#7A8BA6", margin: 0 }}>Noch nicht geprüft.</p>
                <p style={{ fontSize: 11, color: "#7A8BA6", margin: "4px 0 0" }}>Klicke „Jetzt prüfen" um zu starten.</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span style={{ color: meta!.color, display: "flex" }}>{meta!.icon}</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: meta!.color, margin: 0 }}>{meta!.label}</p>
                    <p style={{ fontSize: 11, color: "#7A8BA6", margin: "2px 0 0" }}>
                      Zuletzt geprüft: {fmtTime(data.latest.checkedAt)}
                    </p>
                  </div>
                </div>

                {data.latest.status === "ERROR" ? (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px" }}>
                    <p style={{ fontSize: 12, color: "#F87171", margin: 0 }}>{data.latest.errorMsg ?? "Unbekannter Fehler"}</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Domain", value: data.latest.domain },
                      { label: "Aussteller", value: data.latest.issuer ?? "—" },
                      { label: "Subject", value: data.latest.subject ?? "—" },
                      { label: "Gültig ab", value: fmt(data.latest.validFrom) },
                      { label: "Gültig bis", value: fmt(data.latest.validTo) },
                      { label: "Verbleibend", value: data.latest.daysLeft !== null ? `${data.latest.daysLeft} Tage` : "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 3px" }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#EDF2F7", margin: 0 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {data.latest.daysLeft !== null && data.latest.status !== "ERROR" && (
                  <DaysBar daysLeft={data.latest.daysLeft} />
                )}
              </>
            )}
          </div>

          {/* History */}
          {data.history.length > 1 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 8px" }}>
                Verlauf (letzte {data.history.length} Prüfungen)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {data.history.map((h) => {
                  const m = STATUS_META[h.status] ?? STATUS_META.UNKNOWN;
                  return (
                    <div key={h.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: "#0F1825", border: "1px solid #1E3050",
                      borderRadius: 7, padding: "8px 12px",
                    }}>
                      <span style={{ color: m.color, display: "flex", flexShrink: 0 }}>{m.icon}</span>
                      <span style={{ fontSize: 11, color: m.color, fontWeight: 600, width: 110 }}>{m.label}</span>
                      <span style={{ fontSize: 11, color: "#7A8BA6", flex: 1 }}>
                        {h.daysLeft !== null ? `${h.daysLeft} Tage verbleibend` : h.errorMsg ?? "—"}
                      </span>
                      <span style={{ fontSize: 10, color: "#7A8BA6" }}>{fmtTime(h.checkedAt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
