"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Mail, Lock, Shield, Clock, Activity, Camera, Trash2, Check, X } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
  hasPassword: boolean;
}

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string | null;
  createdAt: string;
  appName: string | null;
  appSlug: string | null;
}

function fmt(d: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
}

function fmtRel(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${Math.floor(h / 24)} Tag${Math.floor(h / 24) !== 1 ? "en" : ""}`;
}

function actionLabel(action: string, appName: string | null) {
  const map: Record<string, string> = {
    "app.created":        "App erstellt",
    "app.updated":        "App bearbeitet",
    "app.deleted":        "App gelöscht",
    "app.status.changed": "Status geändert",
    "release.created":    "Release erstellt",
    "release.deleted":    "Release gelöscht",
    "doc.created":        "Dokumentation erstellt",
    "doc.updated":        "Dokumentation bearbeitet",
    "changelog.created":  "Changelog-Eintrag erstellt",
    "incident.created":   "Incident gemeldet",
    "incident.resolved":  "Incident geschlossen",
    "screenshot.uploaded":"Screenshot hochgeladen",
  };
  const label = map[action] ?? action;
  return appName ? `${label} — ${appName}` : label;
}

const inputStyle: React.CSSProperties = {
  background: "#0B1220", border: "1px solid #1E3050", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#EDF2F7", outline: "none",
  width: "100%", boxSizing: "border-box",
};

const card: React.CSSProperties = {
  background: "#111C2D", border: "1px solid #1E3050",
  borderRadius: 12, padding: "22px 24px",
};

export function ProfileClient({ user, activity }: { user: UserData; activity: ActivityEntry[] }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  // Profilfelder
  const [name,  setName]  = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Passwort
  const [curPw,  setCurPw]  = useState("");
  const [newPw,  setNewPw]  = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [avatarLoading, setAvatarLoading] = useState(false);

  async function saveProfile() {
    setProfileSaving(true); setProfileMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        setProfileMsg({ ok: true, text: "Profil gespeichert." });
        startTransition(() => router.refresh());
      } else {
        const d = await res.json();
        setProfileMsg({ ok: false, text: d.error ?? "Fehler beim Speichern" });
      }
    } finally { setProfileSaving(false); }
  }

  async function savePassword() {
    if (newPw !== newPw2) { setPwMsg({ ok: false, text: "Passwörter stimmen nicht überein." }); return; }
    setPwSaving(true); setPwMsg(null);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      if (res.status === 204) {
        setPwMsg({ ok: true, text: "Passwort geändert." });
        setCurPw(""); setNewPw(""); setNewPw2("");
      } else {
        const d = await res.json();
        setPwMsg({ ok: false, text: d.error ?? "Fehler beim Ändern" });
      }
    } finally { setPwSaving(false); }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body: fd });
      if (res.ok) {
        const d = await res.json();
        const newUrl = d.avatarUrl + "?t=" + Date.now();
        setAvatarUrl(newUrl);
        await updateSession({ image: d.avatarUrl });
        startTransition(() => router.refresh());
      }
    } finally { setAvatarLoading(false); e.target.value = ""; }
  }

  async function removeAvatar() {
    setAvatarLoading(true);
    try {
      await fetch("/api/user/avatar", { method: "DELETE" });
      setAvatarUrl(null);
      await updateSession({ image: null });
      startTransition(() => router.refresh());
    } finally { setAvatarLoading(false); }
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <User size={22} style={{ color: "#2563E8" }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>Mein Profil</h1>
      </div>

      {/* Avatar + Basis-Info */}
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 28 }}>
        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%",
            background: avatarUrl ? "transparent" : "rgba(37,99,232,0.15)",
            border: "2px solid rgba(37,99,232,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", position: "relative",
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 28, fontWeight: 700, color: "#2563E8" }}>{initials}</span>
            )}
            {avatarLoading && (
              <div style={{
                position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: 20, height: 20, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              </div>
            )}
          </div>
          {/* Upload-Button */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              position: "absolute", bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: "50%",
              background: "#2563E8", border: "2px solid #060D18",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
            title="Bild hochladen"
          >
            <Camera size={12} color="#fff" />
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: "none" }} onChange={uploadAvatar} />
        </div>

        {/* Name + Meta */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#EDF2F7" }}>{user.name}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: ".1em",
              padding: "2px 8px", borderRadius: 99,
              background: user.role === "ADMIN" ? "rgba(37,99,232,0.18)" : "rgba(16,185,129,0.12)",
              border: `1px solid ${user.role === "ADMIN" ? "rgba(37,99,232,0.35)" : "rgba(16,185,129,0.3)"}`,
              color: user.role === "ADMIN" ? "#60A5FA" : "#34D399",
            }}>
              {user.role}
            </span>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "#7A8BA6" }}>{user.email}</p>
          <div style={{ display: "flex", gap: 20 }}>
            {user.lastLoginAt && (
              <span style={{ fontSize: 11, color: "#4A5B6F" }}>
                Letzter Login: {fmt(user.lastLoginAt)}
              </span>
            )}
            <span style={{ fontSize: 11, color: "#4A5B6F" }}>
              Dabei seit: {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(user.createdAt))}
            </span>
          </div>
        </div>

        {/* Avatar entfernen */}
        {avatarUrl && (
          <button
            onClick={removeAvatar}
            style={{ background: "none", border: "1px solid #1E3050", borderRadius: 8, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7A8BA6" }}
          >
            <Trash2 size={13} /> Bild entfernen
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Profil bearbeiten */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Mail size={15} style={{ color: "#2563E8" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>Profil bearbeiten</span>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 5 }}>Anzeigename</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 5 }}>E-Mail</label>
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
          </div>
          {profileMsg && (
            <p style={{ margin: 0, fontSize: 12, color: profileMsg.ok ? "#34D399" : "#F87171", display: "flex", alignItems: "center", gap: 5 }}>
              {profileMsg.ok ? <Check size={12} /> : <X size={12} />} {profileMsg.text}
            </p>
          )}
          <button
            onClick={saveProfile} disabled={profileSaving}
            style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#2563E8", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: profileSaving ? "not-allowed" : "pointer", opacity: profileSaving ? 0.7 : 1 }}
          >
            <Check size={13} /> {profileSaving ? "Speichern…" : "Speichern"}
          </button>
        </div>

        {/* Passwort ändern */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={15} style={{ color: "#2563E8" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>Passwort ändern</span>
          </div>
          {!user.hasPassword ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "#0B1220", borderRadius: 8, border: "1px solid #1E3050" }}>
              <Shield size={14} style={{ color: "#7A8BA6" }} />
              <p style={{ margin: 0, fontSize: 12, color: "#7A8BA6" }}>SSO-Konto — Passwort wird über Authentik verwaltet.</p>
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 5 }}>Aktuelles Passwort</label>
                <input style={inputStyle} type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} autoComplete="current-password" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 5 }}>Neues Passwort</label>
                <input style={inputStyle} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#7A8BA6", display: "block", marginBottom: 5 }}>Neues Passwort wiederholen</label>
                <input style={inputStyle} type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} autoComplete="new-password" />
              </div>
              {pwMsg && (
                <p style={{ margin: 0, fontSize: 12, color: pwMsg.ok ? "#34D399" : "#F87171", display: "flex", alignItems: "center", gap: 5 }}>
                  {pwMsg.ok ? <Check size={12} /> : <X size={12} />} {pwMsg.text}
                </p>
              )}
              <button
                onClick={savePassword} disabled={pwSaving || !curPw || !newPw}
                style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#2563E8", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: (pwSaving || !curPw || !newPw) ? "not-allowed" : "pointer", opacity: (pwSaving || !curPw || !newPw) ? 0.6 : 1 }}
              >
                <Lock size={13} /> {pwSaving ? "Ändern…" : "Passwort ändern"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Letzte Aktivitäten */}
      {activity.length > 0 && (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Activity size={15} style={{ color: "#2563E8" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7" }}>Letzte Aktivitäten</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {activity.map((a, i) => (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "9px 0",
                borderBottom: i < activity.length - 1 ? "1px solid #1A2A3D" : "none",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563E8", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: "#C8D8E8" }}>
                  {actionLabel(a.action, a.appName)}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#4A5B6F", flexShrink: 0 }}>
                  <Clock size={10} />
                  <span style={{ fontSize: 11 }}>{fmtRel(a.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
