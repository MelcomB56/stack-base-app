"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Tag, Layers, Cpu, FolderOpen, SkipForward } from "lucide-react";
import Link from "next/link";

// ─── Typen ─────────────────────────────────────────────────────────────────

type Category   = { id: string; name: string; color: string };
type Stack      = { id: string; name: string };
type Technology = { id: string; name: string; category: string };
type TagItem    = { id: string; name: string; color: string };
type Target     = { id: string; name: string; host: string | null };

type Options = {
  categories:   Category[];
  stacks:       Stack[];
  technologies: Technology[];
  tags:         TagItem[];
  targets:      Target[];
};

// ─── Konstanten ─────────────────────────────────────────────────────────────

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

const RUNTIME_OPTIONS = [
  { value: "",               label: "— nicht angegeben —" },
  { value: "DOCKER",         label: "Docker" },
  { value: "DOCKER_COMPOSE", label: "Docker Compose" },
  { value: "KUBERNETES",     label: "Kubernetes" },
  { value: "SYSTEMD",        label: "Systemd Service" },
  { value: "PM2",            label: "PM2" },
  { value: "BARE_PROCESS",   label: "Bare Process" },
  { value: "STATIC",         label: "Static / Webserver" },
  { value: "SERVERLESS",     label: "Serverless / FaaS" },
  { value: "PAAS",           label: "PaaS (Heroku, Render …)" },
  { value: "IIS",            label: "IIS / Windows Service" },
  { value: "OTHER",          label: "Sonstiges" },
];

const TECH_CATEGORY_ORDER = ["LANGUAGE", "FRONTEND", "BACKEND", "DATABASE", "INFRASTRUCTURE", "TOOL", "OTHER"];
const TECH_CATEGORY_LABEL: Record<string, string> = {
  LANGUAGE: "Sprache", FRONTEND: "Frontend", BACKEND: "Backend",
  DATABASE: "Datenbank", INFRASTRUCTURE: "Infrastruktur", TOOL: "Tool", OTHER: "Sonstige",
};

const STEPS = [
  { label: "Basics",          hint: "Name & Status" },
  { label: "URLs",            hint: "Links & Logo" },
  { label: "Klassifizierung", hint: "Kategorien & Tags" },
  { label: "Hosting",         hint: "Server & Kontakt" },
];

// ─── DS-Helpers ─────────────────────────────────────────────────────────────

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

// ─── Stepper ────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 28 }}>
      {STEPS.map((step, i) => {
        const done    = i < current;
        const active  = i === current;
        const future  = i > current;
        const isLast  = i === STEPS.length - 1;

        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", flex: isLast ? "0 0 auto" : 1 }}>
            {/* Schritt */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: done ? "#2563E8" : active ? "transparent" : "transparent",
                border: done ? "none" : active ? "2px solid #2563E8" : "2px solid #1E3050",
                color: done ? "#fff" : active ? "#2563E8" : "#4A5B6F",
                transition: "all 200ms",
              }}>
                {done ? <Check size={13} strokeWidth={3} /> : i + 1}
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: done || active ? "#EDF2F7" : "#4A5B6F", margin: 0, whiteSpace: "nowrap" }}>
                  {step.label}
                </p>
                <p style={{ fontSize: 10, color: "#4A5B6F", margin: 0, whiteSpace: "nowrap" }}>
                  {step.hint}
                </p>
              </div>
            </div>

            {/* Verbindungslinie */}
            {!isLast && (
              <div style={{
                flex: 1, height: 2, marginTop: 13, marginLeft: 8, marginRight: 8,
                background: done ? "#2563E8" : "#1E3050",
                transition: "background 200ms",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Haupt-Komponente ────────────────────────────────────────────────────────

export function NewAppForm({ options }: { options: Options }) {
  const router  = useRouter();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Step 1 — Basics
  const [name,        setName]        = useState("");
  const [shortDesc,   setShortDesc]   = useState("");
  const [status,      setStatus]      = useState("DEVELOPMENT");
  const [criticality, setCriticality] = useState("");

  // Step 2 — URLs & Logo
  const [urlProd,    setUrlProd]    = useState("");
  const [urlStaging, setUrlStaging] = useState("");
  const [repoUrl,    setRepoUrl]    = useState("");
  const [logoUrl,    setLogoUrl]    = useState("");
  const [language,   setLanguage]   = useState("");
  const [dbType,     setDbType]     = useState("");

  // Step 3 — Klassifizierung
  const [categoryIds,   setCategoryIds]   = useState<string[]>([]);
  const [tagIds,        setTagIds]        = useState<string[]>([]);
  const [stackIds,      setStackIds]      = useState<string[]>([]);
  const [technologyIds, setTechnologyIds] = useState<string[]>([]);

  // Step 4 — Hosting & Kontakt
  const [deploymentTargetId, setDeploymentTargetId] = useState("");
  const [runtimeType,        setRuntimeType]        = useState("");
  const [hostPort,           setHostPort]           = useState("");
  const [containerPort,      setContainerPort]      = useState("");
  const [hostingNotes,       setHostingNotes]       = useState("");
  const [vendor,             setVendor]             = useState("");
  const [contactName,        setContactName]        = useState("");
  const [supportEmail,       setSupportEmail]       = useState("");

  function toggle(ids: string[], setIds: (v: string[]) => void, id: string) {
    setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  const step1Valid = name.trim().length >= 2 && shortDesc.trim().length >= 10;

  const canAdvance = step === 0 ? step1Valid : true;

  async function submit() {
    setLoading(true);
    setError(null);
    const body: Record<string, unknown> = {
      name: name.trim(),
      shortDesc: shortDesc.trim(),
      status,
    };
    if (criticality)        body.criticality        = criticality;
    if (urlProd)            body.urlProd            = urlProd;
    if (urlStaging)         body.urlStaging         = urlStaging;
    if (repoUrl)            body.repoUrl            = repoUrl;
    if (logoUrl)            body.logoUrl            = logoUrl;
    if (language)           body.language           = language;
    if (dbType)             body.dbType             = dbType;
    if (categoryIds.length) body.categoryIds        = categoryIds;
    if (tagIds.length)      body.tagIds             = tagIds;
    if (stackIds.length)    body.stackIds           = stackIds;
    if (technologyIds.length) body.technologyIds    = technologyIds;
    if (deploymentTargetId) body.deploymentTargetId = deploymentTargetId;
    if (runtimeType)        body.runtimeType        = runtimeType;
    if (hostPort)           body.hostPort           = parseInt(hostPort);
    if (containerPort)      body.containerPort      = parseInt(containerPort);
    if (hostingNotes)       body.hostingNotes       = hostingNotes;
    if (vendor)             body.vendor             = vendor;
    if (contactName)        body.contactName        = contactName;
    if (supportEmail)       body.supportEmail       = supportEmail;

    try {
      const res  = await fetch("/api/apps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Fehler beim Speichern"); return; }
      router.push(`/apps/${data.slug}`);
      router.refresh();
    } catch { setError("Netzwerkfehler"); } finally { setLoading(false); }
  }

  const techGroups = TECH_CATEGORY_ORDER.reduce<Record<string, Technology[]>>((acc, cat) => {
    const items = options.technologies.filter((t) => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const CARD: React.CSSProperties = {
    background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 24,
    display: "flex", flexDirection: "column", gap: 18,
  };

  // ── Step-Inhalte ──────────────────────────────────────────────────────────

  const stepContent = [
    // Step 0 — Basics
    <div key="basics" style={CARD}>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#EDF2F7", margin: "0 0 4px" }}>Basics</p>
        <p style={{ fontSize: 12, color: "#7A8BA6", margin: 0 }}>Name und grundlegende Eigenschaften der App</p>
      </div>
      <Field label="Name *">
        <DSInput
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="z.B. AzubiSuite, InfraScope" maxLength={100} autoFocus
        />
        {name.length > 0 && name.trim().length < 2 && (
          <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>Mindestens 2 Zeichen</p>
        )}
      </Field>
      <Field label="Kurzbeschreibung *">
        <DSInput
          value={shortDesc} onChange={(e) => setShortDesc(e.target.value)}
          placeholder="Was macht diese App? (mindestens 10 Zeichen)" maxLength={255}
        />
        {shortDesc.length > 0 && shortDesc.trim().length < 10 && (
          <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>Mindestens 10 Zeichen</p>
        )}
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Status">
          <DSSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </DSSelect>
        </Field>
        <Field label="Kritikalität">
          <DSSelect value={criticality} onChange={(e) => setCriticality(e.target.value)}>
            {CRITICALITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </DSSelect>
        </Field>
      </div>
    </div>,

    // Step 1 — URLs & Logo
    <div key="urls" style={CARD}>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#EDF2F7", margin: "0 0 4px" }}>URLs & Logo</p>
        <p style={{ fontSize: 12, color: "#7A8BA6", margin: 0 }}>Alle Felder optional — können später ergänzt werden</p>
      </div>
      <Field label="Production URL">
        <DSInput value={urlProd} onChange={(e) => setUrlProd(e.target.value)} type="url" placeholder="https://app.example.de" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Staging URL">
          <DSInput value={urlStaging} onChange={(e) => setUrlStaging(e.target.value)} type="url" placeholder="https://staging.example.de" />
        </Field>
        <Field label="Repository URL">
          <DSInput value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} type="url" placeholder="https://github.com/org/repo" />
        </Field>
      </div>
      <Field label="Logo URL">
        <DSInput value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} type="url" placeholder="https://example.de/icon.svg" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Sprache / Framework">
          <DSInput value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="z.B. Next.js, Laravel" maxLength={50} />
        </Field>
        <Field label="Datenbank">
          <DSInput value={dbType} onChange={(e) => setDbType(e.target.value)} placeholder="z.B. PostgreSQL, Redis" maxLength={50} />
        </Field>
      </div>
    </div>,

    // Step 2 — Klassifizierung
    <div key="klasse" style={CARD}>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#EDF2F7", margin: "0 0 4px" }}>Klassifizierung</p>
        <p style={{ fontSize: 12, color: "#7A8BA6", margin: 0 }}>Kategorien, Stacks und Tags für bessere Übersicht</p>
      </div>

      {options.categories.length > 0 && (
        <div>
          <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: 5 }}><FolderOpen size={10} /> Kategorien</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {options.categories.map((c) => (
              <ChipToggle key={c.id} label={c.name} color={c.color}
                selected={categoryIds.includes(c.id)} onClick={() => toggle(categoryIds, setCategoryIds, c.id)} />
            ))}
          </div>
        </div>
      )}

      {options.stacks.length > 0 && (
        <div>
          <label style={{ ...FIELD_LABEL, display: "flex", alignItems: "center", gap: 5 }}><Layers size={10} /> Stacks</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {options.stacks.map((s) => (
              <ChipToggle key={s.id} label={s.name} color="#2563E8"
                selected={stackIds.includes(s.id)} onClick={() => toggle(stackIds, setStackIds, s.id)} />
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
                <p style={{ fontSize: 9, color: "#4A5A70", letterSpacing: ".12em", textTransform: "uppercase", margin: "0 0 5px" }}>
                  {TECH_CATEGORY_LABEL[cat] ?? cat}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {items.map((t) => (
                    <ChipToggle key={t.id} label={t.name} color="#7C3AED"
                      selected={technologyIds.includes(t.id)} onClick={() => toggle(technologyIds, setTechnologyIds, t.id)} />
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
              <ChipToggle key={t.id} label={t.name} color={t.color}
                selected={tagIds.includes(t.id)} onClick={() => toggle(tagIds, setTagIds, t.id)} />
            ))}
          </div>
        </div>
      )}

      {options.categories.length === 0 && options.stacks.length === 0 && options.technologies.length === 0 && options.tags.length === 0 && (
        <p style={{ fontSize: 13, color: "#4A5B6F", textAlign: "center", padding: "20px 0" }}>
          Noch keine Kategorien, Stacks oder Tags angelegt.
        </p>
      )}
    </div>,

    // Step 3 — Hosting & Kontakt
    <div key="hosting" style={CARD}>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#EDF2F7", margin: "0 0 4px" }}>Hosting & Kontakt</p>
        <p style={{ fontSize: 12, color: "#7A8BA6", margin: 0 }}>Deployment-Infos und Ansprechpartner — alle optional</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Deployment Target">
          <DSSelect value={deploymentTargetId} onChange={(e) => setDeploymentTargetId(e.target.value)}>
            <option value="">— kein Target —</option>
            {options.targets.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.host ? ` (${t.host})` : ""}</option>
            ))}
          </DSSelect>
        </Field>
        <Field label="Laufzeit-Typ">
          <DSSelect value={runtimeType} onChange={(e) => setRuntimeType(e.target.value)}>
            {RUNTIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </DSSelect>
        </Field>
        <Field label="Host-Port (extern)">
          <DSInput value={hostPort} onChange={(e) => setHostPort(e.target.value)} type="number" min="1" max="65535" placeholder="z.B. 80" />
        </Field>
        <Field label="Container-Port (intern)">
          <DSInput value={containerPort} onChange={(e) => setContainerPort(e.target.value)} type="number" min="1" max="65535" placeholder="z.B. 3000" />
        </Field>
      </div>

      <Field label="Hosting-Notizen">
        <textarea
          value={hostingNotes} onChange={(e) => setHostingNotes(e.target.value)}
          maxLength={2000} rows={3}
          placeholder="z.B. pm2 start npm --name myapp -- start, hinter nginx auf Port 80"
          style={{ width: "100%", background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8, padding: "8px 10px", color: "#EDF2F7", fontSize: 12, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }}
        />
      </Field>

      <div style={{ height: 1, background: "#1E3050" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Field label="Anbieter / Hersteller">
          <DSInput value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="z.B. Atlassian" maxLength={100} />
        </Field>
        <Field label="Ansprechpartner">
          <DSInput value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Name" maxLength={100} />
        </Field>
        <Field label="Support E-Mail">
          <DSInput value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} type="email" placeholder="support@example.de" maxLength={200} />
        </Field>
      </div>
    </div>,
  ];

  const isLast = step === STEPS.length - 1;
  const isSkippable = step >= 2;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/apps" style={{ textDecoration: "none" }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "transparent", color: "#7A8BA6", borderRadius: 8, fontSize: 12, border: "1px solid transparent", cursor: "pointer" }}>
            <ArrowLeft size={13} /> Zurück
          </button>
        </Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0 }}>Neue App anlegen</h1>
          <p style={{ fontSize: 12, color: "#7A8BA6", marginTop: 2, marginBottom: 0 }}>Schritt {step + 1} von {STEPS.length}</p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper current={step} />

      {/* Step-Inhalt */}
      {stepContent[step]}

      {/* Fehler */}
      {error && (
        <p style={{ fontSize: 13, color: "#EF4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", margin: 0 }}>
          {error}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "transparent", color: step === 0 ? "#2A3A50" : "#7A8BA6", borderRadius: 8, fontSize: 13, border: `1px solid ${step === 0 ? "#1A2640" : "#1E3050"}`, cursor: step === 0 ? "default" : "pointer" }}
        >
          <ArrowLeft size={13} /> Zurück
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          {isSkippable && !isLast && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "transparent", color: "#7A8BA6", borderRadius: 8, fontSize: 13, border: "1px solid #1E3050", cursor: "pointer" }}
            >
              <SkipForward size={13} /> Überspringen
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={submit}
              disabled={loading || !step1Valid}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 20px", background: "#2563E8", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              App anlegen
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 20px", background: canAdvance ? "#2563E8" : "#1A2640", color: canAdvance ? "#fff" : "#4A5B6F", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: canAdvance ? "pointer" : "not-allowed" }}
            >
              Weiter <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
