"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Save, Trash2, Tag, Layers, Cpu, FolderOpen,
  Upload, X, Info, Globe, Server, Puzzle, LayoutGrid,
} from "lucide-react";
import Link from "next/link";

// ─── Typen ──────────────────────────────────────────────────────────────────

type Category   = { id: string; name: string; color: string };
type Stack      = { id: string; name: string };
type Technology = { id: string; name: string; category: string };
type TagItem    = { id: string; name: string; color: string };

type AppData = {
  slug:               string;
  name:               string;
  shortDesc:          string;
  status:             string;
  language:           string | null;
  urlProd:            string | null;
  urlStaging:         string | null;
  repoUrl:            string | null;
  dockerImage:        string | null;
  agentUrl:           string | null;
  agentToken:         string | null;
  dbType:             string | null;
  contactName:        string | null;
  supportEmail:       string | null;
  criticality:        string | null;
  vendor:             string | null;
  logoUrl:            string | null;
  githubToken:        string | null;
  deploymentTargetId: string | null;
  runtimeType:        string | null;
  hostPort:           number | null;
  containerPort:      number | null;
  hostingNotes:       string | null;
  testCoveragePercent:   number | null;
  lastDeploymentSuccess: boolean | null;
  securityRating:        number | null;
  categoryIds:        string[];
  tagIds:             string[];
  stackIds:           string[];
  technologyIds:      string[];
};

type DeploymentTarget = { id: string; name: string; type: string; host: string | null };

type Options = {
  categories:   Category[];
  stacks:       Stack[];
  technologies: Technology[];
  tags:         TagItem[];
  targets:      DeploymentTarget[];
};

// ─── Konstanten ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "DEVELOPMENT", label: "Entwicklung" },
  { value: "TESTING",     label: "Testing" },
  { value: "PRODUCTION",  label: "Produktion" },
  { value: "MAINTENANCE", label: "Wartung" },
  { value: "ARCHIVED",    label: "Archiviert" },
];

const CRITICALITY_OPTIONS = [
  { value: "",         label: "— nicht angegeben —" },
  { value: "CRITICAL", label: "Kritisch" },
  { value: "HIGH",     label: "Hoch" },
  { value: "MEDIUM",   label: "Mittel" },
  { value: "LOW",      label: "Niedrig" },
];

const TECH_CATEGORY_ORDER = ["LANGUAGE", "FRONTEND", "BACKEND", "DATABASE", "INFRASTRUCTURE", "TOOL", "OTHER"];
const TECH_CATEGORY_LABEL: Record<string, string> = {
  LANGUAGE: "Sprache", FRONTEND: "Frontend", BACKEND: "Backend",
  DATABASE: "Datenbank", INFRASTRUCTURE: "Infrastruktur", TOOL: "Tool", OTHER: "Sonstige",
};

const TABS = [
  { id: "general",       label: "Allgemein",       icon: <Info size={13} /> },
  { id: "urls",          label: "URLs & Logo",      icon: <Globe size={13} /> },
  { id: "classify",      label: "Klassifizierung",  icon: <LayoutGrid size={13} /> },
  { id: "hosting",       label: "Hosting",          icon: <Server size={13} /> },
  { id: "integrations",  label: "Integrationen",    icon: <Puzzle size={13} /> },
];

// ─── DS-Helpers ──────────────────────────────────────────────────────────────

const FIELD_LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#7A8BA6",
  textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 5,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={FIELD_LABEL}>{label}</label>{children}</div>;
}

function DSInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ width: "100%", padding: "8px 12px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 8, color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", ...props.style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; props.onFocus?.(e); }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = "#1E3050"; props.onBlur?.(e);  }}
    />
  );
}

function DSSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ width: "100%", padding: "8px 12px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 8, color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit", appearance: "none", cursor: "pointer", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8BA6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 32, boxSizing: "border-box" as const, ...props.style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; props.onFocus?.(e); }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = "#1E3050"; props.onBlur?.(e);  }}
    />
  );
}

function ChipToggle({ label, color, selected, onClick }: {
  label: string; color?: string; selected: boolean; onClick: () => void;
}) {
  const c = color ?? "#7A8BA6";
  return (
    <button type="button" onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: selected ? `${c}22` : "rgba(255,255,255,0.03)",
      color: selected ? c : "#7A8BA6",
      border: `1px solid ${selected ? `${c}66` : "#1E3050"}`,
      cursor: "pointer", transition: "all 120ms",
    }}>
      {label}
    </button>
  );
}

// ─── Haupt-Komponente ────────────────────────────────────────────────────────

export function EditAppForm({ app, options }: { app: AppData; options: Options }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Logo-State (controlled wegen Vorschau + Upload)
  const [logoUrl,      setLogoUrl]      = useState<string>(app.logoUrl ?? "");
  const [previewError, setPreviewError] = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chip-States
  const [categoryIds,   setCategoryIds]   = useState<string[]>(app.categoryIds);
  const [tagIds,        setTagIds]        = useState<string[]>(app.tagIds);
  const [stackIds,      setStackIds]      = useState<string[]>(app.stackIds);
  const [technologyIds, setTechnologyIds] = useState<string[]>(app.technologyIds);

  function toggle(ids: string[], setIds: (v: string[]) => void, id: string) {
    setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch(`/api/apps/${app.slug}/logo`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error ?? "Upload fehlgeschlagen"); return; }
      setLogoUrl(data.logoUrl);
      setPreviewError(false);
    } catch { setUploadError("Netzwerkfehler beim Upload"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd   = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) { if (v !== "") body[k] = v.toString(); }
    body.categoryIds   = categoryIds;
    body.tagIds        = tagIds;
    body.stackIds      = stackIds;
    body.technologyIds = technologyIds;
    body.logoUrl       = logoUrl;
    // Leere Felder explizit auf null setzen
    if (!logoUrl) body.logoUrl = null;

    try {
      const res  = await fetch(`/api/apps/${app.slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Fehler beim Speichern"); return; }
      router.push(`/apps/${data.slug}`);
      router.refresh();
    } catch { setError("Netzwerkfehler"); } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm(`App "${app.name}" wirklich löschen?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/apps/${app.slug}`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json().catch(() => ({})); setError(data.error ?? "Fehler beim Löschen"); return; }
      router.push("/apps");
      router.refresh();
    } catch { setError("Netzwerkfehler"); } finally { setDeleting(false); }
  }

  const techGroups = TECH_CATEGORY_ORDER.reduce<Record<string, Technology[]>>((acc, cat) => {
    const items = options.technologies.filter((t) => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const PANEL: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 16 };
  const DIVIDER: React.CSSProperties = { height: 1, background: "#1A2640", margin: "4px 0" };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 780 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href={`/apps/${app.slug}`} style={{ textDecoration: "none" }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "transparent", color: "#7A8BA6", borderRadius: 8, fontSize: 12, border: "1px solid transparent", cursor: "pointer" }}>
            <ArrowLeft size={13} /> Zurück
          </button>
        </Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0 }}>{app.name} bearbeiten</h1>
          <p style={{ fontSize: 12, color: "#7A8BA6", marginTop: 2, marginBottom: 0 }}>Angaben der App aktualisieren</p>
        </div>
      </div>

      {/* Tab-Bar */}
      <div style={{ display: "flex", gap: 2, background: "#0B1220", borderRadius: 10, padding: 4, border: "1px solid #1E3050" }}>
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "7px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
              border: "none", cursor: "pointer", transition: "all 150ms",
              background: activeTab === i ? "#111C2D" : "transparent",
              color: activeTab === i ? "#EDF2F7" : "#4A5B6F",
              boxShadow: activeTab === i ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
            }}
          >
            <span style={{ color: activeTab === i ? "#2563E8" : "#4A5B6F" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Formular */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 24 }}>

          {/* ── Tab 0: Allgemein ───────────────────────────────────────── */}
          <div style={{ ...PANEL, display: activeTab === 0 ? "flex" : "none" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Name *">
                  <DSInput name="name" required defaultValue={app.name} maxLength={100} />
                </Field>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Kurzbeschreibung *">
                  <DSInput name="shortDesc" required defaultValue={app.shortDesc} maxLength={255} />
                </Field>
              </div>
              <Field label="Status">
                <DSSelect name="status" defaultValue={app.status}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </DSSelect>
              </Field>
              <Field label="Kritikalität">
                <DSSelect name="criticality" defaultValue={app.criticality ?? ""}>
                  {CRITICALITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </DSSelect>
              </Field>
              <Field label="Sprache / Framework">
                <DSInput name="language" defaultValue={app.language ?? ""} placeholder="z.B. Next.js, Laravel" maxLength={50} />
              </Field>
              <Field label="Datenbank">
                <DSInput name="dbType" defaultValue={app.dbType ?? ""} placeholder="z.B. PostgreSQL, Redis" maxLength={50} />
              </Field>
              <Field label="Anbieter / Hersteller">
                <DSInput name="vendor" defaultValue={app.vendor ?? ""} placeholder="z.B. Atlassian" maxLength={100} />
              </Field>
            </div>
            <div style={DIVIDER} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Ansprechpartner">
                <DSInput name="contactName" defaultValue={app.contactName ?? ""} maxLength={100} />
              </Field>
              <Field label="Support E-Mail">
                <DSInput name="supportEmail" type="email" defaultValue={app.supportEmail ?? ""} maxLength={200} />
              </Field>
            </div>
          </div>

          {/* ── Tab 1: URLs & Logo ─────────────────────────────────────── */}
          <div style={{ ...PANEL, display: activeTab === 1 ? "flex" : "none" }}>
            <Field label="Logo / Icon">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10, border: "1px solid #1E3050", overflow: "hidden", background: "#1A2640", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {logoUrl && !previewError
                    ? <img src={logoUrl} alt="Vorschau" onError={() => setPreviewError(true)} onLoad={() => setPreviewError(false)} style={{ width: 44, height: 44, objectFit: "contain" }} />
                    : <span style={{ fontSize: 20 }}>🖼️</span>}
                </div>
                <input type="hidden" name="logoUrl" value={logoUrl} />
                <DSInput
                  type="url"
                  value={logoUrl}
                  placeholder="https://example.de/icon.png (leer = automatisch)"
                  onChange={(e) => { setLogoUrl(e.target.value); setPreviewError(false); setUploadError(null); }}
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 8, color: "#EDF2F7", fontSize: 12, cursor: uploading ? "not-allowed" : "pointer" }}>
                  {uploading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={13} />}
                  {uploading ? "Lädt…" : "Hochladen"}
                </button>
                {logoUrl && (
                  <button type="button" onClick={() => { setLogoUrl(""); setPreviewError(false); setUploadError(null); }}
                    style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: "transparent", border: "1px solid #1E3050", borderRadius: 8, color: "#EF4444", cursor: "pointer" }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon" style={{ display: "none" }} onChange={handleLogoUpload} />
              {uploadError && <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>{uploadError}</p>}
              <p style={{ fontSize: 11, color: "#4A5B6F", margin: "4px 0 0" }}>URL eintragen oder Datei hochladen (PNG, SVG, WebP, ICO · max. 2 MB). Leer = automatische Favicon-Erkennung.</p>
            </Field>
            <div style={DIVIDER} />
            <Field label="Production URL">
              <DSInput name="urlProd" type="url" defaultValue={app.urlProd ?? ""} placeholder="https://app.example.de" />
            </Field>
            <Field label="Staging URL">
              <DSInput name="urlStaging" type="url" defaultValue={app.urlStaging ?? ""} placeholder="https://staging.example.de" />
            </Field>
            <Field label="Repository URL">
              <DSInput name="repoUrl" type="url" defaultValue={app.repoUrl ?? ""} placeholder="https://github.com/org/repo" />
            </Field>
          </div>

          {/* ── Tab 2: Klassifizierung ─────────────────────────────────── */}
          <div style={{ ...PANEL, display: activeTab === 2 ? "flex" : "none" }}>
            {options.categories.length > 0 && (
              <div>
                <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: 5 }}><FolderOpen size={10} /> Kategorien</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {options.categories.map((c) => (
                    <ChipToggle key={c.id} label={c.name} color={c.color} selected={categoryIds.includes(c.id)} onClick={() => toggle(categoryIds, setCategoryIds, c.id)} />
                  ))}
                </div>
              </div>
            )}
            {options.stacks.length > 0 && (
              <div>
                <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: 5 }}><Layers size={10} /> Stacks</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {options.stacks.map((s) => (
                    <ChipToggle key={s.id} label={s.name} color="#2563E8" selected={stackIds.includes(s.id)} onClick={() => toggle(stackIds, setStackIds, s.id)} />
                  ))}
                </div>
              </div>
            )}
            {options.technologies.length > 0 && (
              <div>
                <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: 5 }}><Cpu size={10} /> Technologien</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(techGroups).map(([cat, items]) => (
                    <div key={cat}>
                      <p style={{ fontSize: 9, color: "#4A5A70", letterSpacing: ".12em", textTransform: "uppercase", margin: "0 0 5px" }}>{TECH_CATEGORY_LABEL[cat] ?? cat}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {items.map((t) => (
                          <ChipToggle key={t.id} label={t.name} color="#7C3AED" selected={technologyIds.includes(t.id)} onClick={() => toggle(technologyIds, setTechnologyIds, t.id)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {options.tags.length > 0 && (
              <div>
                <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: 5 }}><Tag size={10} /> Tags</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {options.tags.map((t) => (
                    <ChipToggle key={t.id} label={t.name} color={t.color} selected={tagIds.includes(t.id)} onClick={() => toggle(tagIds, setTagIds, t.id)} />
                  ))}
                </div>
              </div>
            )}
            {options.categories.length === 0 && options.stacks.length === 0 && options.technologies.length === 0 && options.tags.length === 0 && (
              <p style={{ fontSize: 13, color: "#4A5B6F", textAlign: "center", padding: "24px 0" }}>Noch keine Kategorien, Stacks, Technologien oder Tags angelegt.</p>
            )}
          </div>

          {/* ── Tab 3: Hosting ─────────────────────────────────────────── */}
          <div style={{ ...PANEL, display: activeTab === 3 ? "flex" : "none" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Deployment Target">
                <DSSelect name="deploymentTargetId" defaultValue={app.deploymentTargetId ?? ""}>
                  <option value="">— kein Target —</option>
                  {options.targets.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}{t.host ? ` (${t.host})` : ""}</option>
                  ))}
                </DSSelect>
              </Field>
              <Field label="Laufzeit-Typ">
                <DSSelect name="runtimeType" defaultValue={app.runtimeType ?? ""}>
                  <option value="">— nicht angegeben —</option>
                  <option value="DOCKER">Docker</option>
                  <option value="DOCKER_COMPOSE">Docker Compose</option>
                  <option value="KUBERNETES">Kubernetes</option>
                  <option value="SYSTEMD">Systemd Service</option>
                  <option value="PM2">PM2</option>
                  <option value="BARE_PROCESS">Bare Process</option>
                  <option value="STATIC">Static / Webserver</option>
                  <option value="SERVERLESS">Serverless / FaaS</option>
                  <option value="PAAS">PaaS (Heroku, Render …)</option>
                  <option value="IIS">IIS / Windows Service</option>
                  <option value="OTHER">Sonstiges</option>
                </DSSelect>
              </Field>
              <Field label="Host-Port (extern)">
                <DSInput name="hostPort" type="number" min="1" max="65535" defaultValue={app.hostPort?.toString() ?? ""} placeholder="z.B. 80" />
              </Field>
              <Field label="Container-Port (intern)">
                <DSInput name="containerPort" type="number" min="1" max="65535" defaultValue={app.containerPort?.toString() ?? ""} placeholder="z.B. 3000" />
              </Field>
            </div>
            <Field label="Hosting-Notizen">
              <textarea
                name="hostingNotes"
                defaultValue={app.hostingNotes ?? ""}
                maxLength={2000}
                rows={4}
                placeholder="z.B. pm2 start npm --name myapp -- start, hinter nginx auf Port 80"
                style={{ width: "100%", background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8, padding: "8px 10px", color: "#EDF2F7", fontSize: 12, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
            </Field>
            {/* Qualitätsfelder für Health Score */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Field label="Testabdeckung (%)">
                <DSInput
                  name="testCoveragePercent"
                  type="number" min="0" max="100"
                  defaultValue={app.testCoveragePercent?.toString() ?? ""}
                  placeholder="z.B. 75"
                />
              </Field>
              <Field label="Sicherheitsrating (0–100)">
                <DSInput
                  name="securityRating"
                  type="number" min="0" max="100"
                  defaultValue={app.securityRating?.toString() ?? ""}
                  placeholder="z.B. 85"
                />
              </Field>
              <Field label="Letztes Deployment">
                <DSSelect name="lastDeploymentSuccess" defaultValue={app.lastDeploymentSuccess === null ? "" : app.lastDeploymentSuccess ? "true" : "false"}>
                  <option value="">— nicht angegeben —</option>
                  <option value="true">Erfolgreich</option>
                  <option value="false">Fehlgeschlagen</option>
                </DSSelect>
              </Field>
            </div>
            <p style={{ fontSize: 11, color: "#4A5B6F", margin: 0 }}>
              Targets verwalten unter <a href="/targets" style={{ color: "#2563E8", textDecoration: "none" }}>Verwaltung → Targets</a>
            </p>
          </div>

          {/* ── Tab 4: Integrationen ───────────────────────────────────── */}
          <div style={{ ...PANEL, display: activeTab === 4 ? "flex" : "none" }}>

            {/* GitHub */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                GitHub
              </p>
              <Field label="Personal Access Token">
                <DSInput name="githubToken" type="password" defaultValue={app.githubToken ?? ""} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" maxLength={255} />
                <p style={{ fontSize: 11, color: "#4A5B6F", margin: "5px 0 0" }}>
                  Nur für private Repos. Scope <code style={{ background: "#1A2640", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>repo</code> (read-only reicht). Leer = öffentliches Repo.
                </p>
              </Field>
            </div>

            <div style={DIVIDER} />

            {/* Ressourcen-Agent */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: "0 0 10px" }}>Ressourcen-Agent</p>
              <div style={{ background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8, padding: "10px 14px", fontSize: 11, fontFamily: "monospace", color: "#7A8BA6", lineHeight: 1.9, marginBottom: 12 }}>
                <span style={{ color: "#4A5B6F" }}># Container-Monitoring:</span><br />
                {"docker run -d --name sb-agent -p 9101:9101 -e SB_CONTAINER=myapp \\"}<br />
                {"  -v /var/run/docker.sock:/var/run/docker.sock ghcr.io/melcomb56/stackbase-agent:latest"}<br />
                <br />
                <span style={{ color: "#4A5B6F" }}># Host-Metriken:</span><br />
                {"docker run -d --name sb-agent -p 9101:9101 ghcr.io/melcomb56/stackbase-agent:latest"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Agent-URL">
                  <DSInput name="agentUrl" type="url" defaultValue={app.agentUrl ?? ""} placeholder="http://192.168.25.45:9101" maxLength={500} />
                </Field>
                <Field label="Agent-Token">
                  <DSInput name="agentToken" type="password" defaultValue={app.agentToken ?? ""} placeholder="sb_xxxxxxxxxxxxxxxx" maxLength={200} />
                </Field>
              </div>
            </div>

            <div style={DIVIDER} />

            {/* Docker */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: "0 0 10px" }}>Docker</p>
              <Field label="Docker Image">
                <DSInput name="dockerImage" defaultValue={app.dockerImage ?? ""} placeholder="org/image:latest" maxLength={200} />
              </Field>
            </div>
          </div>

        </div>

        {/* Fehler */}
        {error && (
          <p style={{ fontSize: 13, color: "#EF4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", margin: "12px 0 0" }}>
            {error}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 14 }}>
          <button type="button" onClick={handleDelete} disabled={deleting || loading}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "transparent", color: "#EF4444", borderRadius: 8, fontSize: 13, border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            App löschen
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={`/apps/${app.slug}`} style={{ textDecoration: "none" }}>
              <button type="button" style={{ padding: "7px 16px", background: "transparent", color: "#7A8BA6", borderRadius: 8, fontSize: 13, border: "1px solid #1E3050", cursor: "pointer" }}>
                Abbrechen
              </button>
            </Link>
            <button type="submit" disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 20px", background: "#2563E8", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Speichern
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
