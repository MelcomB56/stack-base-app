"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2, Tag, Layers, Cpu, FolderOpen } from "lucide-react";
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
  dbType:       string | null;
  contactName:  string | null;
  supportEmail: string | null;
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

  // Relation-States
  const [categoryIds,   setCategoryIds]   = useState<string[]>(app.categoryIds);
  const [tagIds,        setTagIds]        = useState<string[]>(app.tagIds);
  const [stackIds,      setStackIds]      = useState<string[]>(app.stackIds);
  const [technologyIds, setTechnologyIds] = useState<string[]>(app.technologyIds);

  function toggle(ids: string[], setIds: (v: string[]) => void, id: string) {
    setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
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
          <p style={SECTION_LABEL}>Infrastruktur</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Docker Image"><DSInput name="dockerImage" defaultValue={app.dockerImage ?? ""} placeholder="org/image:latest" maxLength={200} /></Field>
            <Field label="Datenbank"><DSInput name="dbType" defaultValue={app.dbType ?? ""} placeholder="z.B. PostgreSQL" maxLength={50} /></Field>
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
