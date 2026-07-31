"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Plus, X, Trash2, Loader2, Link2, List, Share2 } from "lucide-react";
import Link from "next/link";
import { AppDepGraph } from "./AppDepGraph";

type AppRef = { id: string; name: string; slug: string; status: string } | null;

type Dependency = {
  id: string;
  dependsOnAppId: string | null;
  dependsOnName: string | null;
  relationshipType: string;
  description: string | null;
  dependsOnApp: AppRef;
};

type Dependent = {
  id: string;
  appId: string;
  relationshipType: string;
  description: string | null;
  app: { id: string; name: string; slug: string; status: string };
};

const REL_LABEL: Record<string, string> = {
  REQUIRES: "benötigt", USES_API: "nutzt API", USES_SERVICE: "nutzt Service", CONTAINS: "enthält", PLANNED: "geplant",
};
const REL_COLOR: Record<string, string> = {
  REQUIRES: "#2563E8", USES_API: "#7C3AED", USES_SERVICE: "#10B981", CONTAINS: "#F59E0B", PLANNED: "#6B7280",
};
const STATUS_COLOR: Record<string, string> = {
  PRODUCTION: "#10B981", DEVELOPMENT: "#3B82F6", TESTING: "#F59E0B", MAINTENANCE: "#F97316", ARCHIVED: "#6B7280",
};

export function DependenciesTab({
  appSlug,
  appName,
  initial,
  availableApps,
}: {
  appSlug: string;
  appName: string;
  initial: { outgoing: Dependency[]; incoming: Dependent[] };
  availableApps: { id: string; name: string; slug: string }[];
}) {
  const [outgoing, setOutgoing] = useState<Dependency[]>(initial.outgoing);
  const [incoming] = useState<Dependent[]>(initial.incoming);
  const [view, setView] = useState<"list" | "graph">("list");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    dependsOnAppId: "",
    dependsOnName: "",
    relationshipType: "REQUIRES" as string,
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function addDep() {
    if (!form.dependsOnAppId && !form.dependsOnName.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/apps/${appSlug}/dependencies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dependsOnAppId: form.dependsOnAppId || undefined,
        dependsOnName: form.dependsOnName.trim() || undefined,
        relationshipType: form.relationshipType,
        description: form.description.trim() || undefined,
      }),
    });
    if (res.ok) {
      const dep = await res.json();
      setOutgoing((p) => [...p, { ...dep, dependsOnApp: availableApps.find((a) => a.id === dep.dependsOnAppId) ?? null }]);
      setShowNew(false);
      setForm({ dependsOnAppId: "", dependsOnName: "", relationshipType: "REQUIRES", description: "" });
    }
    setSaving(false);
  }

  async function removeDep(id: string) {
    setRemoving(id);
    await fetch(`/api/apps/${appSlug}/dependencies?id=${id}`, { method: "DELETE" });
    setOutgoing((p) => p.filter((d) => d.id !== id));
    setRemoving(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* View-Toggle */}
        <div style={{ display: "flex", gap: 4, background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8, padding: 3 }}>
          {(["list", "graph"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                borderRadius: 6, fontSize: 11, fontWeight: 500, border: "none",
                background: view === v ? "rgba(37,99,232,0.2)" : "transparent",
                color: view === v ? "#2563E8" : "#7A8BA6", cursor: "pointer",
              }}>
              {v === "list" ? <List size={11} /> : <Share2 size={11} />}
              {v === "list" ? "Liste" : "Graph"}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNew(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={12} /> Abhängigkeit hinzufügen
        </button>
      </div>

      {/* Graph-View */}
      {view === "graph" && (
        <AppDepGraph
          appName={appName}
          outgoing={outgoing.map((d) => ({
            name: d.dependsOnApp?.name ?? d.dependsOnName ?? "?",
            slug: d.dependsOnApp?.slug ?? null,
            status: d.dependsOnApp?.status ?? null,
            relationshipType: d.relationshipType,
          }))}
          incoming={incoming.map((d) => ({
            name: d.app.name,
            slug: d.app.slug,
            status: d.app.status,
            relationshipType: d.relationshipType,
          }))}
        />
      )}

      {/* Formular */}
      {showNew && (
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>Neue Abhängigkeit</p>
            <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", color: "#7A8BA6", cursor: "pointer", padding: 2 }}>
              <X size={14} />
            </button>
          </div>

          <div>
            <label style={{ fontSize: 10, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 4 }}>App (im System)</label>
            <select
              value={form.dependsOnAppId}
              onChange={(e) => setForm((f) => ({ ...f, dependsOnAppId: e.target.value, dependsOnName: "" }))}
              style={{ width: "100%", padding: "7px 10px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, color: form.dependsOnAppId ? "#EDF2F7" : "#7A8BA6", fontSize: 12, outline: "none", fontFamily: "inherit" }}>
              <option value="">— Bitte wählen —</option>
              {availableApps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {!form.dependsOnAppId && (
            <div>
              <label style={{ fontSize: 10, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 4 }}>Oder: Externer Name</label>
              <input
                value={form.dependsOnName}
                onChange={(e) => setForm((f) => ({ ...f, dependsOnName: e.target.value }))}
                placeholder="z.B. Stripe API, PostgreSQL"
                style={{ width: "100%", padding: "7px 10px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, color: "#EDF2F7", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(REL_LABEL).map(([k, v]) => (
              <button key={k} onClick={() => setForm((f) => ({ ...f, relationshipType: k }))}
                style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${REL_COLOR[k]}55`, color: REL_COLOR[k], background: form.relationshipType === k ? `${REL_COLOR[k]}22` : "transparent", transition: "background 150ms" }}>
                {v}
              </button>
            ))}
          </div>

          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Beschreibung (optional)"
            style={{ padding: "7px 10px", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, color: "#EDF2F7", fontSize: 12, outline: "none", fontFamily: "inherit" }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={addDep} disabled={saving || (!form.dependsOnAppId && !form.dependsOnName.trim())}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#2563E8", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={11} className="animate-spin" /> : null}
              Hinzufügen
            </button>
          </div>
        </div>
      )}

      {/* Listen-View */}
      {view === "list" && (
        <div style={{ display: "contents" }}>

      {/* Ausgehende Abhängigkeiten */}
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowRight size={11} /> Diese App hängt ab von
        </p>
        {outgoing.length === 0 ? (
          <p style={{ fontSize: 12, color: "#7A8BA6", margin: 0, textAlign: "center", padding: "12px 0" }}>Keine Abhängigkeiten eingetragen</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {outgoing.map((dep) => {
              const name = dep.dependsOnApp?.name ?? dep.dependsOnName ?? "Unbekannt";
              const slug = dep.dependsOnApp?.slug ?? null;
              const status = dep.dependsOnApp?.status ?? null;
              return (
                <div key={dep.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#1A2640", borderRadius: 8, border: "1px solid #1E3050" }}>
                  <Link2 size={11} style={{ color: "#7A8BA6", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                    {slug ? (
                      <Link href={`/apps/${slug}`} style={{ fontSize: 12, fontWeight: 600, color: "#2563E8", textDecoration: "none" }}>{name}</Link>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7" }}>{name}</span>
                    )}
                    {status && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[status] ?? "#7A8BA6", display: "inline-block", flexShrink: 0 }} />
                    )}
                    <span style={{ padding: "1px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600, background: `${REL_COLOR[dep.relationshipType]}18`, color: REL_COLOR[dep.relationshipType], border: `1px solid ${REL_COLOR[dep.relationshipType]}44` }}>
                      {REL_LABEL[dep.relationshipType] ?? dep.relationshipType}
                    </span>
                    {dep.description && <span style={{ fontSize: 11, color: "#7A8BA6" }}>{dep.description}</span>}
                  </div>
                  <button onClick={() => removeDep(dep.id)} disabled={removing === dep.id}
                    style={{ background: "none", border: "none", color: "#7A8BA6", cursor: "pointer", padding: 4, flexShrink: 0, opacity: removing === dep.id ? 0.5 : 1 }}>
                    {removing === dep.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Eingehende Abhängigkeiten */}
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={11} /> Andere Apps hängen ab von dieser
        </p>
        {incoming.length === 0 ? (
          <p style={{ fontSize: 12, color: "#7A8BA6", margin: 0, textAlign: "center", padding: "12px 0" }}>Keine bekannten Abhängigkeiten</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {incoming.map((dep) => (
              <div key={dep.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#1A2640", borderRadius: 8, border: "1px solid #1E3050" }}>
                <Link2 size={11} style={{ color: "#7A8BA6", flexShrink: 0 }} />
                <Link href={`/apps/${dep.app.slug}`} style={{ fontSize: 12, fontWeight: 600, color: "#2563E8", textDecoration: "none", flex: 1 }}>{dep.app.name}</Link>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[dep.app.status] ?? "#7A8BA6", display: "inline-block", flexShrink: 0 }} />
                <span style={{ padding: "1px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600, background: `${REL_COLOR[dep.relationshipType]}18`, color: REL_COLOR[dep.relationshipType], border: `1px solid ${REL_COLOR[dep.relationshipType]}44` }}>
                  {REL_LABEL[dep.relationshipType] ?? dep.relationshipType}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

        </div>
      )}
    </div>
  );
}
