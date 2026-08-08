"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Check, Eye, EyeOff, AlertCircle, ChevronDown, Shield } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomRoleRef { id: string; name: string; color: string }

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  isLocalUser: boolean;
  customRoles: CustomRoleRef[];
}

interface Props {
  initialUsers: UserRow[];
  availableRoles: CustomRoleRef[];
  currentUserId: string;
  isSuperAdmin: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYSTEM_ROLES = [
  { value: "SUPER_ADMIN", label: "Super-Admin", color: "#7C3AED" },
  { value: "ADMIN",       label: "Admin",       color: "#2563E8" },
  { value: "DEVELOPER",   label: "Entwickler",  color: "#0891B2" },
  { value: "TESTER",      label: "Tester",      color: "#D97706" },
  { value: "CUSTOMER",    label: "Kunde",        color: "#059669" },
  { value: "GUEST",       label: "Gast",         color: "#6B7280" },
];

const inputStyle: React.CSSProperties = {
  background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#EDF2F7", outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 150ms",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const sr = SYSTEM_ROLES.find((r) => r.value === role);
  const color = sr?.color ?? "#6B7280";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      {sr?.label ?? role}
    </span>
  );
}

function CustomRolePill({ role }: { role: CustomRoleRef }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600,
      background: `${role.color}18`, color: role.color, border: `1px solid ${role.color}30`,
    }}>
      {role.name}
    </span>
  );
}

function Avatar({ user }: { user: UserRow }) {
  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
      background: "rgba(37,99,232,0.15)", border: "1px solid rgba(37,99,232,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: "#2563E8", overflow: "hidden",
    }}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </div>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────

interface ModalProps {
  user: UserRow | null; // null = create mode
  availableRoles: CustomRoleRef[];
  isSuperAdmin: boolean;
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
}

function UserModal({ user, availableRoles, isSuperAdmin, currentUserId, onClose, onSaved }: ModalProps) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState(user?.role ?? "GUEST");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.customRoles.map((r) => r.id) ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSystemRoles = isSuperAdmin
    ? SYSTEM_ROLES
    : SYSTEM_ROLES.filter((r) => r.value !== "SUPER_ADMIN");

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { name, email, role, customRoleIds: selectedRoles };
      if (password.trim()) body.password = password.trim();
      if (!isEdit) {
        if (!password.trim()) { setError("Passwort ist Pflichtfeld"); setSaving(false); return; }
      }

      const url  = isEdit ? `/api/admin/users/${user!.id}` : "/api/admin/users";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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

  function toggleCustomRole(id: string) {
    setSelectedRoles((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14,
        padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>
            {isEdit ? "Nutzer bearbeiten" : "Neuen Nutzer anlegen"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#7A8BA6", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 5 }}>Name *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Max Mustermann"
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }} />
          </div>

          {/* E-Mail */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 5 }}>E-Mail *</label>
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nutzer@beispiel.de"
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }} />
          </div>

          {/* Passwort — nur für lokale User oder Neu-Anlage */}
          {(!isEdit || user?.isLocalUser) ? (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 5 }}>
                {isEdit ? "Neues Passwort (leer = unverändert)" : "Passwort *"}
              </label>
              <div style={{ position: "relative" }}>
                <input style={{ ...inputStyle, paddingRight: 38 }} type={showPw ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEdit ? "Leer lassen um nicht zu ändern" : "Mindestens 8 Zeichen"}
                  autoComplete="new-password"
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }} />
                <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7A8BA6", display: "flex" }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", fontSize: 12, color: "#A78BFA" }}>
              <Shield size={13} style={{ flexShrink: 0 }} />
              Authentik-Nutzer — Passwort wird in Authentik verwaltet
            </div>
          )}

          {/* System-Rolle */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 5 }}>System-Rolle</label>
            <div style={{ position: "relative" }}>
              <select style={{ ...inputStyle, appearance: "none", paddingRight: 32, cursor: "pointer" }}
                value={role} onChange={(e) => setRole(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }}>
                {availableSystemRoles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#7A8BA6", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Custom Roles */}
          {availableRoles.length > 0 && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em", display: "block", marginBottom: 8 }}>
                Benutzerdefinierte Rollen
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {availableRoles.map((r) => {
                  const checked = selectedRoles.includes(r.id);
                  return (
                    <button key={r.id} type="button" onClick={() => toggleCustomRole(r.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500,
                        background: checked ? `${r.color}20` : "#0B1220",
                        border: `1px solid ${checked ? r.color : "#1E3050"}`,
                        color: checked ? r.color : "#7A8BA6", cursor: "pointer", transition: "all 150ms",
                      }}>
                      {checked && <Check size={11} />}
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#F87171" }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button onClick={submit} disabled={saving}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 16px", borderRadius: 8,
                background: "linear-gradient(90deg, #2563E8 0%, #7C3AED 100%)",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
              }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? "Speichern…" : isEdit ? "Speichern" : "Nutzer anlegen"}
            </button>
            <button onClick={onClose}
              style={{
                padding: "10px 16px", borderRadius: 8, background: "#0B1220",
                border: "1px solid #1E3050", color: "#7A8BA6", fontSize: 13, cursor: "pointer",
              }}>
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UsersManager({ initialUsers, availableRoles, currentUserId, isSuperAdmin }: Props) {
  const [users, setUsers]     = useState<UserRow[]>(initialUsers);
  const [modal, setModal]     = useState<UserRow | null | "new">(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reload() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  }

  async function deleteUser(id: string) {
    if (!confirm("Nutzer wirklich löschen? Alle zugehörigen Daten bleiben erhalten.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) await reload();
    } finally {
      setDeleting(null);
    }
  }

  const thStyle: React.CSSProperties = {
    padding: "10px 14px", textAlign: "left",
    fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase",
    color: "#4A5B6F", borderBottom: "1px solid #1E3050",
  };
  const tdStyle: React.CSSProperties = {
    padding: "12px 14px", fontSize: 13, color: "#A0B4C8",
    borderBottom: "1px solid #0F1D30", verticalAlign: "middle",
  };

  return (
    <>
      <div style={{
        background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1E3050" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#7A8BA6" }}>{users.length} Nutzer gesamt</p>
          <button
            onClick={() => setModal("new")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8,
              background: "linear-gradient(90deg, #2563E8 0%, #7C3AED 100%)",
              border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
            <Plus size={13} />
            Nutzer anlegen
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Nutzer</th>
                <th style={thStyle}>System-Rolle</th>
                <th style={thStyle}>Benutzerdefinierte Rollen</th>
                <th style={thStyle}>Letzter Login</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar user={user} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>{user.name}</span>
                          {user.id === currentUserId && (
                            <span style={{ fontSize: 10, color: "#2563E8", fontWeight: 400 }}>(Du)</span>
                          )}
                          {!user.isLocalUser && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 99, fontSize: 9, fontWeight: 700, letterSpacing: ".06em", background: "rgba(124,58,237,0.12)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.25)" }}>
                              <Shield size={8} /> AUTHENTIK
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: "#4A5B6F" }}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <RoleBadge role={user.role} />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {user.customRoles.length > 0
                        ? user.customRoles.map((r) => <CustomRolePill key={r.id} role={r} />)
                        : <span style={{ fontSize: 11, color: "#4A5B6F" }}>—</span>
                      }
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
                      : <span style={{ color: "#4A5B6F" }}>Nie</span>}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                      <button
                        onClick={() => setModal(user)}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, background: "#0B1220", border: "1px solid #1E3050", color: "#7A8BA6", fontSize: 12, cursor: "pointer" }}>
                        <Pencil size={11} /> Bearbeiten
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={deleting === user.id}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 12, cursor: "pointer" }}>
                          {deleting === user.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                          Löschen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <UserModal
          user={modal === "new" ? null : modal}
          availableRoles={availableRoles}
          isSuperAdmin={isSuperAdmin}
          currentUserId={currentUserId}
          onClose={() => setModal(null)}
          onSaved={async () => { setModal(null); await reload(); }}
        />
      )}
    </>
  );
}
