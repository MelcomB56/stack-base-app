"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2, Tag, Layers, Cpu, FolderOpen, Upload, X } from "lucide-react";
import Link from "next/link";

// ─── Typen ─────────────────────────────────────────────────────────────────

type Category   = { id: string; name: string; color: string };
type Stack      = { id: string; name: string };
type Technology = { id: string; name: string; category: string };
type TagItem    = { id: string; name: string; color: string };

type AppData = {
  slug:         string;
  name:         string;
  shortDesc:    string;
  status:       string;
  language:     string | null;
  urlProd:      string | null;
  urlStaging:   string | null;
  repoUrl:      string | null;
  dockerImage:  string | null;
  agentUrl:     string | null;
  agentToken:   string | null;
  dbType:       string | null;
  contactName:  string | null;
  supportEmail: string | null;
  criticality:  string | null;
  vendor:       string | null;
  logoUrl:      string | null;
  githubToken:  string | null;
  categoryIds:  string[];
  tagIds:       string[];
  stackIds:     string[];
  technologyIds: string[];
};

type Options = {
  categories:   Category[];
  stacks:       Stack[];
  technologies: Technology[];
  tags:         TagItem[];
};

// ─── Style-Konstanten ───────────────────────────────────────────────────────

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

const PANEL: React.CSSProperties = {
  background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12,
  padding: 18, display: "flex", flexDirection: "column", gap: 14,
};
const SECTION_LABEL: React.CSSProperties = {
  fontSize: 9, fontWeight: 600, letterSpacing: ".15em",
  textTransform: "uppercase", color: "#7A8BA6", margin: 0,
};
const FIELD_LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#7A8BA6",
  textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 5,
};

// ─── DS-Helpers ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={FIELD_LABEL}>{label}</label>{children}</div>;
}

function DSInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ width: "100%", padding: "7px 12px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 8, color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit", ...props.style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; props.onFocus?.(e); }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; props.onBlur?.(e); }}
    />
  );
}

function DSSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ width: "100%", padding: "7px 12px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 8, color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit", appearance: "none", cursor: "pointer", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8BA6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 32, ...props.style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; props.onFocus?.(e); }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; props.onBlur?.(e); }}
    />
  );
}

// ─── Multi-Toggle-Chip ──────────────────────────────────────────────────────

function ChipToggle({ label, color, selected, onClick }: {
  label: string; color?: string; selected: boolean; onClick: () => void;
}) {
  const c = color ?? "#7A8BA6";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
        background: selected ? `${c}22` : "rgba(255,255,255,0.03)",
        color: selected ? c : "#7A8BA6",
        border: `1px solid ${selected ? `${c}66` : "#1E3050"}`,
        cursor: "pointer", transition: "all 120ms",
      }}
    >
      {label}
    </button>
  );
}

// ─── Haupt-Komponente ───────────────────────────────────────────────────────

export function EditAppForm({ app, options }: { app: AppData; options: Options }) {
  const router = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>(app.logoUrl ?? "");
  const [previewError, setPreviewError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Relation-States
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
      const res = await fetch(`/api/apps/${app.slug}/logo`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error ?? "Upload fehlgeschlagen"); return; }
      setLogoUrl(data.logoUrl);
      setPreviewError(false);
    } catch { setUploadError("Netzwerkfehler beim Upload"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  async function handleLogoRemove() {
    setLogoUrl("");
    setPreviewError(false);
    setUploadError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) { if (v !== "") body[k] = v.toString(); }
    body.categoryIds   = categoryIds;
    body.tagIds        = tagIds;
    body.stackIds      = stackIds;
    body.technologyIds = technologyIds;

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

  // Technologien nach Kategorie gruppieren
  const techGroups = TECH_CATEGORY_ORDER.reduce<Record<string, Technology[]>>((acc, cat) => {
    const items = options.technologies.filter((t) => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href={`/apps/${app.slug}`} style={{ textDecoration: "none" }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "transparent", color: "#7A8BA6", borderRadius: 8, fontSize: 12, border: "1px solid transparent", cursor: "pointer" }}>
            <ArrowLeft size={13} /> Zurück
          </button>
        </Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0 }}>{app.name} bearbeiten</h1>
          <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 2 }}>Angaben der App aktualisieren</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Basis */}
        <div style={PANEL}>
          <p style={SECTION_LABEL}>Basis-Informationen</p>
          <Field label="Name *"><DSInput name="name" required defaultValue={app.name} maxLength={100} /></Field>
          <Field label="Kurzbeschreibung *"><DSInput name="shortDesc" required defaultValue={app.shortDesc} maxLength={255} /></Field>

          {/* Logo / Icon */}
          <Field label="Logo / Icon">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Vorschau */}
              <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 8, border: "1px solid #1E3050", overflow: "hidden", background: "#1A2640", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {logoUrl && !previewError ? (
                  <img
                    src={logoUrl}
                    alt="Logo-Vorschau"
                    onError={() => setPreviewError(true)}
                    onLoad={() => setPreviewError(false)}
                    style={{ width: 40, height: 40, objectFit: "contain" }}
                  />
                ) : (
                  <span style={{ fontSize: 18 }}>🖼️</span>
                )}
              </div>

              {/* URL-Eingabe (controlled) */}
              <input type="hidden" name="logoUrl" value={logoUrl} />
              <DSInput
                type="url"
                value={logoUrl}
                placeholder="https://example.de/icon.png (leer = automatisch)"
                onChange={(e) => { setLogoUrl(e.target.value); setPreviewError(false); setUploadError(null); }}
                style={{ flex: 1 }}
              />

              {/* Upload-Button */}
              <button
                type="button"
                title="Datei hochladen"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 8, color: "#EDF2F7", fontSize: 12, cursor: uploading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
              >
                {uploading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={13} />}
                {uploading ? "Lädt…" : "Hochladen"}
              </button>

              {/* Entfernen */}
              {logoUrl && (
                <button
                  type="button"
                  title="Logo entfernen"
                  onClick={handleLogoRemove}
                  style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, background: "transparent", border: "1px solid #1E3050", borderRadius: 8, color: "#EF4444", cursor: "pointer" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* verstecktes File-Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
              style={{ display: "none" }}
              onChange={handleLogoUpload}
            />

            {uploadError && (
              <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>{uploadError}</p>
            )}
            <p style={{ fontSize: 11, color: "#4A5B6F", margin: "4px 0 0" }}>
              URL eintragen oder Datei hochladen (PNG, SVG, WebP, ICO · max. 2 MB). Leer = automatische Favicon-Erkennung.
            </p>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Status">
              <DSSelect name="status" defaultValue={app.status}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </DSSelect>
            </Field>
            <Field label="Sprache / Framework">
              <DSInput name="language" defaultValue={app.language ?? ""} placeholder="z.B. Next.js" maxLength={50} />
            </Field>
          </div>
        </div>

        {/* URLs */}
        <div style={PANEL}>
          <p style={SECTION_LABEL}>URLs</p>
          <Field label="Produktion"><DSInput name="urlProd" type="url" defaultValue={app.urlProd ?? ""} placeholder="https://app.example.de" /></Field>
          <Field label="Staging"><DSInput name="urlStaging" type="url" defaultValue={app.urlStaging ?? ""} placeholder="https://staging.example.de" /></Field>
          <Field label="Repository"><DSInput name="repoUrl" type="url" defaultValue={app.repoUrl ?? ""} placeholder="https://github.com/org/repo" /></Field>
        </div>

        {/* Infrastruktur */}
        <div style={PANEL}>
          <p style={SECTION_LABEL}>Infrastruktur &amp; Betrieb</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Docker Image"><DSInput name="dockerImage" defaultValue={app.dockerImage ?? ""} placeholder="org/image:latest" maxLength={200} /></Field>
            <Field label="Datenbank"><DSInput name="dbType" defaultValue={app.dbType ?? ""} placeholder="z.B. PostgreSQL" maxLength={50} /></Field>
            <Field label="Kritikalität">
              <DSSelect name="criticality" defaultValue={app.criticality ?? ""}>
                {CRITICALITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </DSSelect>
            </Field>
            <Field label="Anbieter / Hersteller">
              <DSInput name="vendor" defaultValue={app.vendor ?? ""} placeholder="z.B. Atlassian, Microsoft" maxLength={100} />
            </Field>
          </div>
        </div>

        {/* Ressourcen-Monitoring */}
        <div style={PANEL}>
          <p style={{ ...SECTION_LABEL, display: "flex", alignItems: "center", gap: 6 }}>
            Ressourcen-Monitoring
          </p>
          <p style={{ fontSize: 12, color: "#7A8BA6", margin: "0 0 4px" }}>
            Deploye den Stack-Base Agent auf deinem Server, trage URL + Token ein. Funktioniert für Docker und Non-Docker, intern und extern.
          </p>
          <div style={{ background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8, padding: "10px 14px", fontSize: 12, fontFamily: "monospace", color: "#7A8BA6", lineHeight: 1.8, marginBottom: 4 }}>
            <span style={{ color: "#4A5B6F" }}># Variante A — Container-Monitoring:</span><br />
            {"docker run -d --name stackbase-agent -p 9101:9101 -e SB_CONTAINER=myapp -v /var/run/docker.sock:/var/run/docker.sock ghcr.io/melcomb56/stackbase-agent:latest"}<br />
            <br />
            <span style={{ color: "#4A5B6F" }}># Variante B — Host-Metriken:</span><br />
            {"docker run -d --name stackbase-agent -p 9101:9101 ghcr.io/melcomb56/stackbase-agent:latest"}<br />
            <br />
            <span style={{ color: "#4A5B6F" }}># Variante C — Natives Binary (ohne Docker):</span><br />
            {"curl -L https://github.com/MelcomB56/stack-base-app/releases/latest/download/stackbase-agent-linux-amd64 -o stackbase-agent && chmod +x stackbase-agent"}<br />
            {"SB_API_KEY=mein-token ./stackbase-agent"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Agent-URL">
              <DSInput name="agentUrl" type="url" defaultValue={app.agentUrl ?? ""} placeholder="http://192.168.25.45:9101" maxLength={500} />
            </Field>
            <Field label="Agent-Token (vom Agent beim Start angezeigt)">
              <DSInput name="agentToken" type="password" defaultValue={app.agentToken ?? ""} placeholder="sb_xxxxxxxxxxxxxxxx" maxLength={200} />
            </Field>
          </div>
        </div>

        {/* GitHub Integration */}
        <div style={PANEL}>
          <p style={{ ...SECTION_LABEL, display: "flex", alignItems: "center", gap: 6 }}>
            GitHub Integration
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <Field label="GitHub Personal Access Token">
              <DSInput
                name="githubToken"
                type="password"
                defaultValue={app.githubToken ?? ""}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (wird verschlüsselt gespeichert)"
                maxLength={255}
              />
              <p style={{ fontSize: 10, color: "#7A8BA6", margin: "4px 0 0" }}>
                Nur erforderlich für private Repositories. Token benötigt Scope <code style={{ background: "#1A2640", padding: "1px 4px", borderRadius: 3 }}>repo</code> (read-only reicht).
                Leer lassen für öffentliche Repos.
              </p>
            </Field>
          </div>
        </div>

        {/* Zuweisungen */}
        <div style={PANEL}>
          <p style={{ ...SECTION_LABEL, display: "flex", alignItems: "center", gap: 6 }}>
            Zuweisungen
          </p>

          {/* Kategorien */}
          {options.categories.length > 0 && (
            <div>
              <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: 5 }}>
                <FolderOpen size={10} /> Kategorien
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {options.categories.map((cat) => (
                  <ChipToggle
                    key={cat.id} label={cat.name} color={cat.color}
                    selected={categoryIds.includes(cat.id)}
                    onClick={() => toggle(categoryIds, setCategoryIds, cat.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stacks */}
          {options.stacks.length > 0 && (
            <div>
              <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: 5 }}>
                <Layers size={10} /> Stacks
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {options.stacks.map((s) => (
                  <ChipToggle
                    key={s.id} label={s.name} color="#2563E8"
                    selected={stackIds.includes(s.id)}
                    onClick={() => toggle(stackIds, setStackIds, s.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Technologien */}
          {options.technologies.length > 0 && (
            <div>
              <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: 5 }}>
                <Cpu size={10} /> Technologien
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(techGroups).map(([cat, items]) => (
                  <div key={cat}>
                    <p style={{ fontSize: 9, color: "#4A5A70", letterSpacing: ".12em", textTransform: "uppercase", margin: "0 0 5px" }}>
                      {TECH_CATEGORY_LABEL[cat] ?? cat}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {items.map((tech) => (
                        <ChipToggle
                          key={tech.id} label={tech.name} color="#7C3AED"
                          selected={technologyIds.includes(tech.id)}
                          onClick={() => toggle(technologyIds, setTechnologyIds, tech.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {options.tags.length > 0 && (
            <div>
              <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: 5 }}>
                <Tag size={10} /> Tags
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {options.tags.map((tag) => (
                  <ChipToggle
                    key={tag.id} label={tag.name} color={tag.color}
                    selected={tagIds.includes(tag.id)}
                    onClick={() => toggle(tagIds, setTagIds, tag.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {options.categories.length === 0 && options.stacks.length === 0 && options.technologies.length === 0 && options.tags.length === 0 && (
            <p style={{ fontSize: 12, color: "#4A5A70", margin: 0 }}>
              Noch keine Kategorien, Stacks, Technologien oder Tags angelegt.
            </p>
          )}
        </div>

        {/* Kontakt */}
        <div style={PANEL}>
          <p style={SECTION_LABEL}>Kontakt</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Ansprechpartner"><DSInput name="contactName" defaultValue={app.contactName ?? ""} maxLength={100} /></Field>
            <Field label="Support E-Mail"><DSInput name="supportEmail" type="email" defaultValue={app.supportEmail ?? ""} maxLength={200} /></Field>
          </div>
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "#EF4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", margin: 0 }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
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
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#2563E8", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Speichern
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
