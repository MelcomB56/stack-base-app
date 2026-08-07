"use client";

import { useState, useCallback } from "react";
import { useCan } from "@/lib/permissions-context";
import {
  Tag, Plus, Pencil, Trash2, X, Check, Loader2, AlertCircle,
  Home, Server, Code2, Brain, Users, Activity, Network, Zap, BookOpen,
  Shield, Globe, Database, Cloud, Lock, Settings, Monitor, Package,
  Layers, Star, Heart, Bell, Mail, FileText, Folder, BarChart2,
  Cpu, Wifi, HardDrive, Terminal, Bug, Rocket, Coffee, Box,
  Briefcase, Building, ShoppingCart, Truck, UserCheck, Search,
  ServerCrash, Wrench, Plug, Eye, Smartphone, Tablet, Layout, Map,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Server, Code2, Brain, Users, Activity, Network, Zap, BookOpen,
  Shield, Globe, Database, Cloud, Lock, Settings, Monitor, Package,
  Layers, Star, Heart, Bell, Mail, FileText, Folder, BarChart2,
  Cpu, Wifi, HardDrive, Terminal, Bug, Rocket, Coffee, Box,
  Briefcase, Building, ShoppingCart, Truck, UserCheck, Search,
  ServerCrash, Wrench, Plug, Eye, Smartphone, Tablet, Layout, Map, Tag,
};

function CategoryIcon({ icon, fallback, color }: { icon: string | null; fallback: string; color: string }) {
  if (!icon) return <span>{fallback}</span>;
  const LucideComp = ICON_MAP[icon];
  if (LucideComp) return <LucideComp size={20} color={color} />;
  // Emoji oder Freitext
  return <span style={{ fontSize: 18, overflow: "hidden", maxWidth: 32, display: "block", textAlign: "center" }}>{icon.slice(0, 2)}</span>;
}

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  sortOrder: number;
  _count: { apps: number };
};

const PRESET_COLORS = [
  "#2563E8", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#EC4899", "#14B8A6", "#F97316", "#84CC16",
  "#6366F1", "#E11D48",
];

function DSInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && (
        <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          padding: "9px 12px", background: "#1A2640",
          border: `1px solid ${focused ? "#2563E8" : "#1E3050"}`, borderRadius: 8,
          color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit",
          transition: "border-color 150ms", width: "100%", ...props.style,
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      />
    </div>
  );
}

function DSTextarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && (
        <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        style={{
          padding: "9px 12px", background: "#1A2640",
          border: `1px solid ${focused ? "#2563E8" : "#1E3050"}`, borderRadius: 8,
          color: "#EDF2F7", fontSize: 13, outline: "none", fontFamily: "inherit",
          transition: "border-color 150ms", width: "100%", resize: "vertical",
          minHeight: 72, ...props.style,
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      />
    </div>
  );
}

// ─── Kategorie-Modal (Create + Edit) ───────────────────────────────────────

interface ModalProps {
  editing: Category | null;
  onClose: () => void;
  onSave: (data: { name: string; description: string; color: string; icon: string; sortOrder: number }) => Promise<void>;
}

function CategoryModal({ editing, onClose, onSave }: ModalProps) {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [color, setColor] = useState(editing?.color ?? "#2563E8");
  const [icon, setIcon] = useState(editing?.icon ?? "");
  const [sortOrder, setSortOrder] = useState(editing?.sortOrder ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ name, description, color, icon, sortOrder });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14,
        padding: 24, width: "100%", maxWidth: 460,
        display: "flex", flexDirection: "column", gap: 20,
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>
            {editing ? "Kategorie bearbeiten" : "Neue Kategorie"}
          </p>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#7A8BA6", padding: 4, display: "flex", borderRadius: 6 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EDF2F7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A8BA6"; }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <DSInput
            label="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Frontend"
            required
            maxLength={100}
          />

          <DSTextarea
            label="Beschreibung"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kurze Beschreibung (optional) ..."
            maxLength={255}
          />

          {/* Farbauswahl */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#7A8BA6", textTransform: "uppercase", letterSpacing: ".1em" }}>
              Farbe
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 24, height: 24, borderRadius: 6, background: c,
                    border: "none", cursor: "pointer",
                    outline: color === c ? `2px solid ${c}` : "2px solid transparent",
                    outlineOffset: 2, transition: "outline 100ms",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: color, flexShrink: 0, border: "1px solid rgba(255,255,255,0.12)" }} />
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#2563E8"
                maxLength={7}
                style={{
                  padding: "7px 10px", background: "#1A2640", border: "1px solid #1E3050",
                  borderRadius: 7, color: "#EDF2F7", fontSize: 12, outline: "none",
                  fontFamily: "monospace", width: 110, transition: "border-color 150ms",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2563E8"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3050"; }}
              />
              <span style={{ fontSize: 11, color: "#4A5A72" }}>Eigener Hex-Wert</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <DSInput
              label="Icon (optional)"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🚀 oder Kürzel"
              maxLength={50}
            />
            <DSInput
              label="Sortierung"
              type="number"
              value={String(sortOrder)}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              min={0}
              max={999}
            />
          </div>

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 12px", borderRadius: 8,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              fontSize: 12, color: "#F87171",
            }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 16px", background: "transparent", color: "#7A8BA6", border: "1px solid #1E3050", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              style={{
                padding: "8px 18px", background: "#2563E8", color: "#fff", border: "none",
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: saving || !name.trim() ? "not-allowed" : "pointer",
                opacity: saving || !name.trim() ? 0.65 : 1,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {saving
                ? <Loader2 size={13} className="animate-spin" />
                : <Check size={13} />
              }
              {editing ? "Speichern" : "Erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Lösch-Dialog ──────────────────────────────────────────────────────────

interface DeleteDialogProps {
  category: Category;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteDialog({ category, onClose, onConfirm }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = category._count.apps > 0;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Löschen");
      setDeleting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#111C2D", border: "1px solid #1E3050", borderRadius: 14,
        padding: 24, width: "100%", maxWidth: 380,
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trash2 size={16} style={{ color: "#EF4444" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#EDF2F7", margin: 0 }}>
              Kategorie löschen?
            </p>
            <p style={{ fontSize: 12, color: "#7A8BA6", margin: "3px 0 0" }}>
              „{category.name}" wird dauerhaft entfernt.
            </p>
          </div>
        </div>

        {blocked && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 12px", borderRadius: 8,
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
            fontSize: 12, color: "#FCD34D",
          }}>
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            Diese Kategorie wird von {category._count.apps} App(s) verwendet und kann nicht gelöscht werden.
          </div>
        )}

        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 12px", borderRadius: 8,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            fontSize: 12, color: "#F87171",
          }}>
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", background: "transparent", color: "#7A8BA6", border: "1px solid #1E3050", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || blocked}
            style={{
              padding: "8px 18px", background: "#EF4444", color: "#fff", border: "none",
              borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: deleting || blocked ? "not-allowed" : "pointer",
              opacity: deleting || blocked ? 0.5 : 1,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {deleting
              ? <Loader2 size={13} className="animate-spin" />
              : <Trash2 size={13} />
            }
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Haupt-Komponente ───────────────────────────────────────────────────────

export function CategoriesManager({ initial }: { initial: Category[] }) {
  const canCreate = useCan("categories.create");
  const canEdit   = useCan("categories.update");
  const canDelete = useCan("categories.delete");

  const [categories, setCategories] = useState<Category[]>(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  function openCreate() { setEditTarget(null); setModalOpen(true); }
  function openEdit(cat: Category) { setEditTarget(cat); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditTarget(null); }

  async function handleSave(data: { name: string; description: string; color: string; icon: string; sortOrder: number }) {
    const url = editTarget ? `/api/categories/${editTarget.id}` : "/api/categories";
    const method = editTarget ? "PATCH" : "POST";
    const body = {
      ...data,
      description: data.description || undefined,
      icon: data.icon || undefined,
    };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unbekannter Fehler" }));
      throw new Error(err.error ?? "Fehler");
    }
    await refresh();
    closeModal();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unbekannter Fehler" }));
      throw new Error(err.error ?? "Fehler");
    }
    await refresh();
    setDeleteTarget(null);
  }

  return (
    <>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Tag size={18} style={{ color: "#2563E8" }} />
              Kategorien
            </h1>
            <p style={{ fontSize: 13, color: "#7A8BA6", marginTop: 4 }}>
              {categories.length} Kategorie{categories.length !== 1 ? "n" : ""} verfügbar
            </p>
          </div>
          {canCreate && (
            <button
              onClick={openCreate}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#2563E8", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer" }}
            >
              <Plus size={14} />
              Neue Kategorie
            </button>
          )}
        </div>

        {/* Grid */}
        {categories.length === 0 ? (
          <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#7A8BA6", marginBottom: 14 }}>
              Noch keine Kategorien angelegt.
            </p>
            {canCreate && (
              <button
                onClick={openCreate}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#1A2640", color: "#EDF2F7", borderRadius: 8, fontSize: 13, border: "1px solid #1E3050", cursor: "pointer" }}
              >
                <Plus size={13} />
                Erste Kategorie anlegen
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  background: "#111C2D", border: "1px solid #1E3050", borderRadius: 12,
                  overflow: "hidden", display: "flex", flexDirection: "column",
                  transition: "border-color 150ms, box-shadow 150ms",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "rgba(37,99,232,0.35)";
                  el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "#1E3050";
                  el.style.boxShadow = "none";
                }}
              >
                {/* Akzentstreifen */}
                <div style={{ height: 3, background: cat.color }} />

                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 18, fontWeight: 700,
                    background: `${cat.color}22`, color: cat.color,
                    overflow: "hidden",
                  }}>
                    <CategoryIcon icon={cat.icon} fallback={cat.name.charAt(0).toUpperCase()} color={cat.color} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#EDF2F7", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.name}
                    </p>
                    <p style={{ fontSize: 11, color: cat.description ? "#7A8BA6" : "#4A5A72", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.description ?? "Keine Beschreibung"}
                    </p>
                  </div>

                  {/* App-Anzahl + Aktionen */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: "#7A8BA6", fontVariantNumeric: "tabular-nums" }}>
                      {cat._count.apps} App{cat._count.apps !== 1 ? "s" : ""}
                    </span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {canEdit && (
                        <button
                          onClick={() => openEdit(cat)}
                          title="Bearbeiten"
                          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, cursor: "pointer", color: "#7A8BA6", transition: "color 150ms, border-color 150ms" }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#EDF2F7"; b.style.borderColor = "#2563E8"; }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#7A8BA6"; b.style.borderColor = "#1E3050"; }}
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          title="Löschen"
                          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#1A2640", border: "1px solid #1E3050", borderRadius: 7, cursor: "pointer", color: "#7A8BA6", transition: "color 150ms, border-color 150ms" }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#EF4444"; b.style.borderColor = "rgba(239,68,68,0.4)"; }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#7A8BA6"; b.style.borderColor = "#1E3050"; }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <CategoryModal
          editing={editTarget}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          category={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
