"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Loader2, X, Check, AlertCircle, Users, ChevronRight, Pencil } from "lucide-react";
import type { Action, PermissionGroup } from "@/lib/permissions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoleRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  color: string;
  userCount: number;
  createdAt: string;
}

interface Props {
  initialRoles: RoleRow[];
  permissionGroups: PermissionGroup[];
  actionOrder: Action[];
  actionLabels: Record<Action, string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#EDF2F7", outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 150ms",
};

const COLORS = [
  "#2563E8", "#7C3AED", "#0891B2", "#059669",
  "#D97706", "#DC2626", "#DB2777", "#6B7280",
];

// ─── Role Create/Edit Modal ───────────────────────────────────────────────────

interface RoleModalProps {
  role: RoleRow | null; // null = create
  onClose: () => void;
  onSaved: () => void;
}

function RoleModal({ role, onClose, onSaved }: RoleModalProps) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [color, setColor] = useState(role?.color ?? "#2563E8");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) { setError("Name ist Pflichtfeld"); return; }
    setSaving(true);
    setError(null);
    try {
      const body = { name: name.trim(), description: description.trim(), color };
      const url = role ? `/api/admin/roles/${role.id}` : "/api/admin/roles";
      const res = await fetch(url, { method: role ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Fehler beim Speichern");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>
            {role ? "Rolle bearbeiten" : "Neue Rolle anlegen"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#7A8BA6", display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 5 }}>Name *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. App Viewer"
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 5 }}>Beschreibung</label>
            <input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional — kurze Erklärung"
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 8 }}>Farbe</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: color === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", outline: color === c ? `2px solid ${c}` : "none", outlineOffset: 1 }} />
              ))}
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#F87171" }}>
              <AlertCircle size={12} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <button onClick={submit} disabled={saving}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: "linear-gradient(90deg, #2563E8 0%, #7C3AED 100%)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {saving ? "Speichern…" : role ? "Speichern" : "Anlegen"}
            </button>
            <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: 8, background: "#0B1220", border: "1px solid #1E3050", color: "#7A8BA6", fontSize: 13, cursor: "pointer" }}>Abbrechen</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Permission Matrix ────────────────────────────────────────────────────────

interface MatrixProps {
  role: RoleRow;
  permissionGroups: PermissionGroup[];
  actionOrder: Action[];
  actionLabels: Record<Action, string>;
  onChanged: (newPerms: string[]) => void;
}

function PermissionMatrix({ role, permissionGroups, actionOrder, actionLabels, onChanged }: MatrixProps) {
  const [permissions, setPermissions] = useState<Set<string>>(new Set(role.permissions));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const toggle = useCallback((permId: string) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId); else next.add(permId);
      return next;
    });
    setDirty(true);
    setSaved(false);
  }, []);

  // Toggle entire row (resource)
  const toggleResource = useCallback((group: PermissionGroup) => {
    const ids = Object.keys(group.actions).map((a) => `${group.resource}.${a}`);
    const allChecked = ids.every((id) => permissions.has(id));
    setPermissions((prev) => {
      const next = new Set(prev);
      if (allChecked) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
    setDirty(true);
    setSaved(false);
  }, [permissions]);

  // Toggle entire column (action)
  const toggleAction = useCallback((action: Action) => {
    const ids = permissionGroups
      .filter((g) => action in g.actions)
      .map((g) => `${g.resource}.${action}`);
    const allChecked = ids.every((id) => permissions.has(id));
    setPermissions((prev) => {
      const next = new Set(prev);
      if (allChecked) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
    setDirty(true);
    setSaved(false);
  }, [permissions, permissionGroups]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: [...permissions] }),
      });
      if (res.ok) {
        setSaved(true);
        setDirty(false);
        onChanged([...permissions]);
      }
    } finally {
      setSaving(false);
    }
  }

  const thStyle: React.CSSProperties = {
    padding: "8px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".1em",
    textTransform: "uppercase", color: "#4A5B6F", textAlign: "center", whiteSpace: "nowrap",
    borderBottom: "1px solid #1E3050",
  };

  const totalPerms = [...permissions].length;
  const totalPossible = permissionGroups.reduce((s, g) => s + Object.keys(g.actions).length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Matrix header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 12px", borderBottom: "1px solid #1E3050" }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#EDF2F7" }}>{role.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#4A5B6F" }}>
            {totalPerms} von {totalPossible} Berechtigungen aktiv
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saved && !dirty && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#34D399" }}>
              <Check size={12} /> Gespeichert
            </span>
          )}
          <button onClick={save} disabled={saving || !dirty}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 7, background: dirty ? "#2563E8" : "#1A2640",
              border: "none", color: dirty ? "#fff" : "#4A5B6F",
              fontSize: 12, fontWeight: 600, cursor: saving || !dirty ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1, transition: "all 150ms",
            }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {saving ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: "left", padding: "8px 14px 8px 20px", width: "40%" }}>Ressource</th>
              {actionOrder.map((action) => {
                const ids = permissionGroups.filter((g) => action in g.actions).map((g) => `${g.resource}.${action}`);
                const allChecked = ids.length > 0 && ids.every((id) => permissions.has(id));
                return (
                  <th key={action} style={thStyle}>
                    <button onClick={() => toggleAction(action)} title={`Alle "${actionLabels[action]}" umschalten`}
                      style={{
                        display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4,
                        background: "none", border: "none", cursor: "pointer",
                        color: allChecked ? "#2563E8" : "#4A5B6F", padding: "2px 6px", borderRadius: 4,
                        transition: "color 150ms",
                      }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${allChecked ? "#2563E8" : "#1E3050"}`,
                        background: allChecked ? "#2563E8" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {allChecked && <Check size={9} color="white" />}
                      </span>
                      {actionLabels[action]}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {permissionGroups.map((group, i) => {
              const rowIds = Object.keys(group.actions).map((a) => `${group.resource}.${a}`);
              const allRowChecked = rowIds.every((id) => permissions.has(id));
              const someChecked = rowIds.some((id) => permissions.has(id));

              return (
                <tr key={group.resource} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)" }}>
                  {/* Resource label with row-toggle */}
                  <td style={{ padding: "9px 14px 9px 20px", borderBottom: "1px solid #0F1D30" }}>
                    <button onClick={() => toggleResource(group)}
                      style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%", textAlign: "left" }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                        border: `1.5px solid ${allRowChecked ? "#2563E8" : someChecked ? "#2563E8" : "#1E3050"}`,
                        background: allRowChecked ? "#2563E8" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        position: "relative",
                      }}>
                        {allRowChecked && <Check size={9} color="white" />}
                        {!allRowChecked && someChecked && (
                          <span style={{ width: 6, height: 2, background: "#2563E8", borderRadius: 1 }} />
                        )}
                      </span>
                      <span style={{ fontSize: 13, color: allRowChecked || someChecked ? "#EDF2F7" : "#7A8BA6", fontWeight: allRowChecked || someChecked ? 500 : 400 }}>
                        {group.label}
                      </span>
                    </button>
                  </td>
                  {/* Checkboxes per action */}
                  {actionOrder.map((action) => {
                    const permId = `${group.resource}.${action}`;
                    const exists = action in group.actions;
                    const checked = exists && permissions.has(permId);
                    return (
                      <td key={action} style={{ padding: "9px 10px", textAlign: "center", borderBottom: "1px solid #0F1D30" }}>
                        {exists ? (
                          <button onClick={() => toggle(permId)} title={group.actions[action]}
                            style={{
                              width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${checked ? "#2563E8" : "#1E3050"}`,
                              background: checked ? "#2563E8" : "transparent",
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", transition: "all 150ms",
                            }}>
                            {checked && <Check size={11} color="white" />}
                          </button>
                        ) : (
                          <span style={{ display: "inline-block", width: 20, height: 20 }} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── System Role Info Card ────────────────────────────────────────────────────

const SYSTEM_ROLES: { name: string; label: string; access: string; tier: "full" | "admin" | "custom"; }[] = [
  { name: "SUPER_ADMIN", label: "Super-Admin",  access: "Vollzugriff + Systemeinstellungen",       tier: "full"   },
  { name: "ADMIN",       label: "Admin",         access: "Vollzugriff auf alle Bereiche",            tier: "admin"  },
  { name: "DEVELOPER",   label: "Entwickler",    access: "Nur über zugewiesene Custom Roles",        tier: "custom" },
  { name: "TESTER",      label: "Tester",        access: "Nur über zugewiesene Custom Roles",        tier: "custom" },
  { name: "CUSTOMER",    label: "Kunde",         access: "Nur über zugewiesene Custom Roles",        tier: "custom" },
  { name: "GUEST",       label: "Gast",          access: "Nur über zugewiesene Custom Roles",        tier: "custom" },
];

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  full:   { bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.25)", text: "#A78BFA", dot: "#7C3AED" },
  admin:  { bg: "rgba(37,99,232,0.08)",  border: "rgba(37,99,232,0.25)",  text: "#60A5FA", dot: "#2563E8" },
  custom: { bg: "rgba(255,255,255,0.03)",border: "#1E3050",               text: "#6B7E99", dot: "#334155" },
};

function SystemRolesInfo() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
      {/* Header — immer sichtbar */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(37,99,232,0.12)", border: "1px solid rgba(37,99,232,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563E8" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>System-Rollen &amp; Custom Roles — Zwei-Schichten-Modell</p>
            <p style={{ margin: "1px 0 0", fontSize: 11, color: "#4A5B6F" }}>
              Jeder Nutzer trägt eine System-Rolle und kann zusätzlich Custom Roles erhalten
            </p>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A5B6F" strokeWidth="2"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms", flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Body — aufklappbar */}
      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid #1E3050" }}>
          {/* Erklärung */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "14px 0 16px" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1A2A3D", borderRadius: 9, padding: "12px 14px" }}>
              <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#4A5B6F" }}>Schicht 1 — System-Rolle</p>
              <p style={{ margin: 0, fontSize: 12, color: "#7A8BA6", lineHeight: 1.6 }}>
                Pflichtfeld pro Nutzer. <strong style={{ color: "#A0B4C8" }}>SUPER_ADMIN und ADMIN</strong> erhalten automatisch Vollzugriff — Custom Roles werden nicht ausgewertet. Alle anderen Rollen haben ohne Custom Roles <strong style={{ color: "#A0B4C8" }}>keinerlei Rechte</strong>.
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1A2A3D", borderRadius: 9, padding: "12px 14px" }}>
              <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#4A5B6F" }}>Schicht 2 — Custom Roles</p>
              <p style={{ margin: 0, fontSize: 12, color: "#7A8BA6", lineHeight: 1.6 }}>
                Optionale, frei konfigurierbare Rollen mit granularen Einzelrechten (z. B. <em>Apps anzeigen</em>, <em>Incidents melden</em>). Ein Nutzer kann mehrere Custom Roles haben — Rechte werden addiert.
              </p>
            </div>
          </div>

          {/* System-Rollen Tabelle */}
          <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#4A5B6F" }}>System-Rollen im Überblick</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {SYSTEM_ROLES.map((sr) => {
              const c = TIER_COLORS[sr.tier];
              return (
                <div key={sr.name} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "9px 13px", borderRadius: 8,
                  background: c.bg, border: `1px solid ${c.border}`,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
                  <code style={{ fontSize: 11, fontWeight: 700, color: c.text, letterSpacing: ".05em", minWidth: 110, flexShrink: 0 }}>
                    {sr.name}
                  </code>
                  <span style={{ fontSize: 11, color: "#7A8BA6", flex: 1 }}>
                    {sr.label}
                  </span>
                  <span style={{ fontSize: 11, color: sr.tier === "custom" ? "#4A5B6F" : c.text }}>
                    {sr.access}
                  </span>
                  {sr.tier !== "custom" && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                      padding: "2px 7px", borderRadius: 4, background: c.border, color: c.text,
                    }}>
                      Bypass
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 11, color: "#4A5B6F", lineHeight: 1.6 }}>
            <strong style={{ color: "#6B7E99" }}>Bypass:</strong> SUPER_ADMIN und ADMIN überspringen die Permission-Prüfung — <code style={{ fontSize: 10, background: "#0B1220", padding: "1px 5px", borderRadius: 3, color: "#A78BFA" }}>canDo()</code> gibt immer <code style={{ fontSize: 10, background: "#0B1220", padding: "1px 5px", borderRadius: 3, color: "#34D399" }}>true</code> zurück, unabhängig von Custom Roles.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RolesManager({ initialRoles, permissionGroups, actionOrder, actionLabels }: Props) {
  const [roles, setRoles]         = useState<RoleRow[]>(initialRoles);
  const [selected, setSelected]   = useState<string | null>(initialRoles[0]?.id ?? null);
  const [modal, setModal]         = useState<RoleRow | null | "new">(null);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const selectedRole = roles.find((r) => r.id === selected) ?? null;

  async function reload() {
    const res = await fetch("/api/admin/roles");
    if (res.ok) setRoles(await res.json());
  }

  async function deleteRole(id: string, name: string) {
    if (!confirm(`Rolle "${name}" löschen? Alle Nutzerzuweisungen dieser Rolle werden entfernt.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selected === id) setSelected(roles.find((r) => r.id !== id)?.id ?? null);
        await reload();
      }
    } finally {
      setDeleting(null);
    }
  }

  function updatePermissions(roleId: string, newPerms: string[]) {
    setRoles((prev) => prev.map((r) => r.id === roleId ? { ...r, permissions: newPerms } : r));
  }

  return (
    <>
      <SystemRolesInfo />
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start" }}>

        {/* Left — Role list */}
        <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #1E3050" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#7A8BA6" }}>Rollen</span>
            <button onClick={() => setModal("new")}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: "rgba(37,99,232,0.12)", border: "1px solid rgba(37,99,232,0.3)", color: "#2563E8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={11} /> Neu
            </button>
          </div>

          {roles.length === 0 ? (
            <p style={{ padding: "20px 14px", fontSize: 12, color: "#4A5B6F", textAlign: "center", margin: 0 }}>
              Noch keine Rollen angelegt
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {roles.map((role) => (
                <button key={role.id} onClick={() => setSelected(role.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "11px 14px", background: selected === role.id ? "rgba(37,99,232,0.1)" : "transparent",
                    border: "none", borderBottom: "1px solid #0F1D30", cursor: "pointer",
                    borderLeft: `3px solid ${selected === role.id ? role.color : "transparent"}`,
                    transition: "all 150ms", textAlign: "left",
                  }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: role.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: selected === role.id ? "#EDF2F7" : "#A0B4C8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {role.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: "#4A5B6F" }}>
                      {role.permissions.length} Rechte · {role.userCount} {role.userCount === 1 ? "Nutzer" : "Nutzer"}
                    </p>
                  </div>
                  {selected === role.id && <ChevronRight size={12} style={{ color: "#2563E8", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — Permission Matrix */}
        {selectedRole ? (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden" }}>
            {/* Role header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: "1px solid #0F1D30", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: selectedRole.color, flexShrink: 0 }} />
              {selectedRole.description && (
                <span style={{ fontSize: 12, color: "#4A5B6F", flex: 1 }}>{selectedRole.description}</span>
              )}
              <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                <button onClick={() => setModal(selectedRole)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, background: "#0B1220", border: "1px solid #1E3050", color: "#7A8BA6", fontSize: 11, cursor: "pointer" }}>
                  <Pencil size={10} /> Umbenennen
                </button>
                {!selectedRole.isSystem && (
                  <button onClick={() => deleteRole(selectedRole.id, selectedRole.name)} disabled={deleting === selectedRole.id}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 11, cursor: "pointer" }}>
                    {deleting === selectedRole.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                    Löschen
                  </button>
                )}
              </div>
            </div>

            <PermissionMatrix
              role={selectedRole}
              permissionGroups={permissionGroups}
              actionOrder={actionOrder}
              actionLabels={actionLabels}
              onChanged={(perms) => updatePermissions(selectedRole.id, perms)}
            />
          </div>
        ) : (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 60, color: "#4A5B6F" }}>
            <Users size={32} style={{ opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 13 }}>Rolle aus der Liste wählen oder neue anlegen</p>
          </div>
        )}
      </div>

      {modal !== null && (
        <RoleModal
          role={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            await reload();
          }}
        />
      )}
    </>
  );
}
