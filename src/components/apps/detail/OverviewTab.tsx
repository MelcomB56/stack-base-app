"use client";

import { Globe, Cpu, Layers, Tag, Server, Database, User, Mail, GitBranch, ExternalLink, Activity } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type HealthCheck = {
  id: string;
  status: string;
  responseTime: number | null;
  checkedAt: string | Date;
};

type MonitorConfig = {
  enabled: boolean;
  checkUrl: string | null;
  intervalMin: number;
} | null;

type AppOverviewProps = {
  app: {
    longDesc: string | null;
    dockerImage: string | null;
    dbType: string | null;
    language: string | null;
    contactName: string | null;
    supportEmail: string | null;
    urlProd: string | null;
    urlStaging: string | null;
    repoUrl: string | null;
    criticality: string | null;
    vendor: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    createdBy: { name: string | null };
    categories: { category: { id: string; name: string; color: string } }[];
    tags: { tag: { id: string; name: string; color: string } }[];
    stacks: { stack: { id: string; name: string } }[];
    technologies: { technology: { id: string; name: string; logoUrl: string | null } }[];
    releases: { isCurrent: boolean; version: string }[];
  };
  healthChecks: HealthCheck[];
  monitorConfig: MonitorConfig;
};

const CRITICALITY_COLORS: Record<string, string> = {
  CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#EAB308", LOW: "#10B981",
};
const CRITICALITY_LABELS: Record<string, string> = {
  CRITICAL: "Kritisch", HIGH: "Hoch", MEDIUM: "Mittel", LOW: "Niedrig",
};

function fmt(d: Date | string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(d));
}

function MiniChart({ checks }: { checks: HealthCheck[] }) {
  const data = [...checks]
    .reverse()
    .slice(-48)
    .map((c) => ({
      time: new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(c.checkedAt)),
      ms: c.responseTime ?? 0,
      up: c.status === "UP" ? 1 : 0,
    }));

  const uptime = checks.length > 0
    ? ((checks.filter((c) => c.status === "UP").length / checks.length) * 100).toFixed(1)
    : "—";

  const avgMs = checks.length > 0
    ? Math.round(checks.filter((c) => c.responseTime).reduce((s, c) => s + (c.responseTime ?? 0), 0) / checks.filter((c) => c.responseTime).length)
    : null;

  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <Activity size={11} /> Verfügbarkeit (letzte 4h)
        </p>
        <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
          <span style={{ color: "#10B981", fontWeight: 600 }}>{uptime}% uptime</span>
          {avgMs !== null && <span style={{ color: "#7A8BA6" }}>ø {avgMs}ms</span>}
        </div>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={data} margin={{ top: 2, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="msGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563E8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563E8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,48,80,0.8)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#7A8BA6" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "#7A8BA6" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8, fontSize: 11, color: "#EDF2F7" }}
              formatter={(val) => [`${val ?? 0}ms`, "Antwortzeit"]}
            />
            <Area type="monotone" dataKey="ms" stroke="#2563E8" strokeWidth={1.5} fill="url(#msGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ fontSize: 12, color: "#7A8BA6", textAlign: "center", margin: "16px 0" }}>Noch keine Daten</p>
      )}
    </div>
  );
}

export function OverviewTab({ app, healthChecks, monitorConfig }: AppOverviewProps) {
  const currentRelease = app.releases.find((r) => r.isCurrent);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 2-Spalten-Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Links: Beschreibung + Chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {app.longDesc && (
            <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 8px" }}>Beschreibung</p>
              <p style={{ fontSize: 13, color: "#C8D8EC", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>{app.longDesc}</p>
            </div>
          )}

          {/* Availability Chart */}
          {monitorConfig && <MiniChart checks={healthChecks} />}

          {/* Quick Links */}
          {(app.urlProd || app.urlStaging || app.repoUrl) && (
            <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 4px" }}>Quick-Links</p>
              {app.urlProd && (
                <a href={app.urlProd} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#EDF2F7", textDecoration: "none", padding: "6px 0", borderBottom: "1px solid #1E3050" }}>
                  <ExternalLink size={12} style={{ color: "#10B981", flexShrink: 0 }} />
                  <span style={{ color: "#7A8BA6", minWidth: 60 }}>Production</span>
                  <span style={{ color: "#2563E8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.urlProd}</span>
                </a>
              )}
              {app.urlStaging && (
                <a href={app.urlStaging} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#EDF2F7", textDecoration: "none", padding: "6px 0", borderBottom: "1px solid #1E3050" }}>
                  <ExternalLink size={12} style={{ color: "#F59E0B", flexShrink: 0 }} />
                  <span style={{ color: "#7A8BA6", minWidth: 60 }}>Staging</span>
                  <span style={{ color: "#2563E8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.urlStaging}</span>
                </a>
              )}
              {app.repoUrl && (
                <a href={app.repoUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#EDF2F7", textDecoration: "none", padding: "6px 0" }}>
                  <GitBranch size={12} style={{ color: "#7A8BA6", flexShrink: 0 }} />
                  <span style={{ color: "#7A8BA6", minWidth: 60 }}>Repository</span>
                  <span style={{ color: "#2563E8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.repoUrl}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Rechts: Metadaten */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Eigenschaften */}
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 12px" }}>Eigenschaften</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: <User size={11} />, label: "Erstellt von", value: app.createdBy.name ?? "—" },
                { icon: <Server size={11} />, label: "Docker Image", value: app.dockerImage ?? "—", mono: true },
                { icon: <Database size={11} />, label: "Datenbank", value: app.dbType ?? "—" },
                { icon: <Cpu size={11} />, label: "Sprache", value: app.language ?? "—" },
                { icon: <Globe size={11} />, label: "Anbieter", value: app.vendor ?? "—" },
                { icon: <Mail size={11} />, label: "Support", value: app.supportEmail ?? "—" },
                { icon: <User size={11} />, label: "Kontakt", value: app.contactName ?? "—" },
              ].map(({ icon, label, value, mono }) => value !== "—" && (
                <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12 }}>
                  <span style={{ color: "#7A8BA6", marginTop: 1, flexShrink: 0 }}>{icon}</span>
                  <span style={{ color: "#7A8BA6", minWidth: 80, flexShrink: 0 }}>{label}</span>
                  <span style={{ color: "#EDF2F7", fontFamily: mono ? "monospace" : undefined, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zeitstempel + Version */}
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Erstellt", value: fmt(app.createdAt) },
              { label: "Aktualisiert", value: fmt(app.updatedAt) },
              currentRelease ? { label: "Version", value: `v${currentRelease.version}`, mono: true } : null,
              app.criticality ? { label: "Kritikalität", value: CRITICALITY_LABELS[app.criticality] ?? app.criticality, color: CRITICALITY_COLORS[app.criticality] } : null,
            ].filter(Boolean).map((item) => item && (
              <div key={item.label}>
                <p style={{ fontSize: 10, color: "#7A8BA6", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: ".08em" }}>{item.label}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: (item as { color?: string }).color ?? "#EDF2F7", margin: 0, fontFamily: (item as { mono?: boolean }).mono ? "monospace" : undefined }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Technologien */}
          {app.technologies.length > 0 && (
            <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 10px" }}>Technologien</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {app.technologies.map(({ technology }) => (
                  <div key={technology.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", background: "#1A2640", borderRadius: 6, fontSize: 11 }}>
                    {technology.logoUrl && <img src={technology.logoUrl} alt="" style={{ width: 12, height: 12, objectFit: "contain" }} />}
                    <span style={{ color: "#EDF2F7" }}>{technology.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Klassifizierungen */}
          {(app.categories.length > 0 || app.stacks.length > 0 || app.tags.length > 0) && (
            <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 10px" }}>Klassifizierungen</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {app.categories.map(({ category }) => (
                  <span key={category.id} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 99, fontSize: 11, border: `1px solid ${category.color}44`, color: category.color, background: `${category.color}18` }}>
                    <Tag size={8} /> {category.name}
                  </span>
                ))}
                {app.stacks.map(({ stack }) => (
                  <span key={stack.id} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 99, fontSize: 11, border: "1px solid rgba(37,99,232,0.3)", color: "#2563E8", background: "rgba(37,99,232,0.1)" }}>
                    <Layers size={8} /> {stack.name}
                  </span>
                ))}
                {app.tags.map(({ tag }) => (
                  <span key={tag.id} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 99, fontSize: 11, border: `1px solid ${tag.color}44`, color: tag.color, background: `${tag.color}18` }}>
                    #{tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
