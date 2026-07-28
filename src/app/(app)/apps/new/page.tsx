"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "DEVELOPMENT", label: "Entwicklung" },
  { value: "TESTING", label: "Testing" },
  { value: "PRODUCTION", label: "Produktion" },
  { value: "MAINTENANCE", label: "Wartung" },
  { value: "ARCHIVED", label: "Archiviert" },
];

const PANEL: React.CSSProperties = { background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 14 };
const SECTION_LABEL: React.CSSProperties = { fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: 0 };
const FIELD_LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 5 };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={FIELD_LABEL}>{label}</label>
      {children}
    </div>
  );
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
      style={{ width: "100%", padding: "7px 12px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 8, color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit", appearance: "none", cursor: "pointer", ...props.style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; props.onFocus?.(e); }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; props.onBlur?.(e); }}
    />
  );
}

export default function NewAppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    for (const [k, v] of fd.entries()) {
      if (v !== "") body[k] = v.toString();
    }

    try {
      const res = await fetch("/api/apps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Fehler beim Speichern"); return; }
      router.push(`/apps/${data.slug}`);
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/apps" style={{ textDecoration: "none" }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "transparent", color: "#7A8BA6", borderRadius: 8, fontSize: 12, border: "1px solid transparent", cursor: "pointer" }}>
            <ArrowLeft size={13} /> Zurück
          </button>
        </Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0 }}>Neue App anlegen</h1>
          <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 2 }}>Grunddaten der App erfassen</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={PANEL}>
          <p style={SECTION_LABEL}>Basis-Informationen</p>
          <Field label="Name *">
            <DSInput name="name" required placeholder="z.B. AzubiSuite" maxLength={100} />
          </Field>
          <Field label="Kurzbeschreibung *">
            <DSInput name="shortDesc" required placeholder="Was macht diese App? (max. 255 Zeichen)" maxLength={255} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Status">
              <DSSelect name="status" defaultValue="DEVELOPMENT">
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </DSSelect>
            </Field>
            <Field label="Sprache / Framework">
              <DSInput name="language" placeholder="z.B. Next.js, Laravel" maxLength={50} />
            </Field>
          </div>
        </div>

        <div style={PANEL}>
          <p style={SECTION_LABEL}>URLs</p>
          <Field label="Produktion">
            <DSInput name="urlProd" type="url" placeholder="https://app.example.de" />
          </Field>
          <Field label="Staging">
            <DSInput name="urlStaging" type="url" placeholder="https://staging.example.de" />
          </Field>
          <Field label="Repository">
            <DSInput name="repoUrl" type="url" placeholder="https://github.com/org/repo" />
          </Field>
        </div>

        <div style={PANEL}>
          <p style={SECTION_LABEL}>Infrastruktur</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Docker Image">
              <DSInput name="dockerImage" placeholder="org/image:latest" maxLength={200} />
            </Field>
            <Field label="Datenbank">
              <DSInput name="dbType" placeholder="z.B. PostgreSQL, Redis" maxLength={50} />
            </Field>
          </div>
        </div>

        <div style={PANEL}>
          <p style={SECTION_LABEL}>Kontakt</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Ansprechpartner">
              <DSInput name="contactName" placeholder="Name" maxLength={100} />
            </Field>
            <Field label="Support E-Mail">
              <DSInput name="supportEmail" type="email" placeholder="support@example.de" maxLength={200} />
            </Field>
          </div>
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "#EF4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px" }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Link href="/apps" style={{ textDecoration: "none" }}>
            <button type="button" style={{ padding: "7px 16px", background: "transparent", color: "#7A8BA6", borderRadius: 8, fontSize: 13, border: "1px solid #1E3050", cursor: "pointer" }}>
              Abbrechen
            </button>
          </Link>
          <button
            type="submit"
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#2563E8", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            App anlegen
          </button>
        </div>
      </form>
    </div>
  );
}
