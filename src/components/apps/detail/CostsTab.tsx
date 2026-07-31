"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AppCost {
  id: string;
  month: string;
  amount: number;
  category: string;
  note: string | null;
}

const CATEGORIES = [
  { value: "SERVER", label: "Server", color: "#2563E8" },
  { value: "DOMAIN", label: "Domain", color: "#8B5CF6" },
  { value: "CDN", label: "CDN", color: "#10B981" },
  { value: "STORAGE", label: "Storage", color: "#F59E0B" },
  { value: "LICENSE", label: "Lizenz", color: "#F97316" },
  { value: "OTHER", label: "Sonstiges", color: "#6B7280" },
] as const;

function catMeta(cat: string) {
  return CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(m: string) {
  const [y, mo] = m.split("-");
  const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  return `${months[parseInt(mo) - 1]} ${y}`;
}

function formatEur(n: number) {
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

// Group costs by month, sorted descending
function groupByMonth(costs: AppCost[]) {
  const map = new Map<string, AppCost[]>();
  for (const c of costs) {
    if (!map.has(c.month)) map.set(c.month, []);
    map.get(c.month)!.push(c);
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

export function CostsTab({ appSlug, initialCosts }: { appSlug: string; initialCosts: AppCost[] }) {
  const [costs, setCosts] = useState<AppCost[]>(initialCosts);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Form state
  const [form, setForm] = useState({ month: currentMonth(), amount: "", category: "SERVER", note: "" });

  const totalCurrentMonth = costs
    .filter((c) => c.month === currentMonth())
    .reduce((s, c) => s + c.amount, 0);

  const prevMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  const totalPrevMonth = costs
    .filter((c) => c.month === prevMonth)
    .reduce((s, c) => s + c.amount, 0);

  const totalAll = costs.reduce((s, c) => s + c.amount, 0);
  const months = [...new Set(costs.map((c) => c.month))].length;

  const delta = totalCurrentMonth - totalPrevMonth;

  async function save() {
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    const res = await fetch(`/api/apps/${appSlug}/costs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    if (!res.ok) return;
    const created = await res.json();
    startTransition(() => {
      setCosts((prev) => [...prev, created]);
      setAdding(false);
      setForm({ month: currentMonth(), amount: "", category: "SERVER", note: "" });
    });
  }

  async function update(id: string, patch: Partial<AppCost>) {
    const res = await fetch(`/api/apps/${appSlug}/costs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const updated = await res.json();
    startTransition(() => {
      setCosts((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditId(null);
    });
  }

  async function remove(id: string) {
    if (!confirm("Kosten-Eintrag löschen?")) return;
    await fetch(`/api/apps/${appSlug}/costs/${id}`, { method: "DELETE" });
    startTransition(() => setCosts((prev) => prev.filter((c) => c.id !== id)));
  }

  const grouped = groupByMonth(costs);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          {
            label: "Aktueller Monat",
            value: formatEur(totalCurrentMonth),
            sub: delta !== 0 && totalPrevMonth > 0 ? (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                color: delta > 0 ? "#EF4444" : "#10B981" }}>
                {delta > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {delta > 0 ? "+" : ""}{formatEur(delta)} vs. Vormonat
              </span>
            ) : totalPrevMonth === 0 ? (
              <span style={{ fontSize: 11, color: "#7A8BA6" }}>Kein Vormonat</span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#7A8BA6" }}>
                <Minus size={11} /> Unverändert
              </span>
            ),
          },
          {
            label: "Vormonat",
            value: formatEur(totalPrevMonth),
            sub: <span style={{ fontSize: 11, color: "#7A8BA6" }}>{formatMonth(prevMonth)}</span>,
          },
          {
            label: "Gesamt (Ø/Monat)",
            value: formatEur(totalAll),
            sub: <span style={{ fontSize: 11, color: "#7A8BA6" }}>
              {months > 0 ? `Ø ${formatEur(totalAll / months)}/Monat` : "Noch keine Daten"}
            </span>,
          },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 6px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#EDF2F7", margin: "0 0 4px", fontVariantNumeric: "tabular-nums" }}>{value}</p>
            {sub}
          </div>
        ))}
      </div>

      {/* Add button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setAdding(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
          background: "#2563E8", border: "none", borderRadius: 7, color: "#fff",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>
          <Plus size={13} /> Kosten hinzufügen
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ background: "#111C2D", border: "1px solid #2563E8", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", margin: 0 }}>Neuer Kosten-Eintrag</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 11, color: "#7A8BA6" }}>
              Monat
              <input type="month" value={form.month}
                onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))}
                style={inputStyle} />
            </label>
            <label style={{ fontSize: 11, color: "#7A8BA6" }}>
              Betrag (€)
              <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                style={inputStyle} />
            </label>
            <label style={{ fontSize: 11, color: "#7A8BA6" }}>
              Kategorie
              <select value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
          </div>
          <label style={{ fontSize: 11, color: "#7A8BA6" }}>
            Notiz (optional)
            <input type="text" placeholder="z.B. Hetzner cx33 Anteil" value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              style={inputStyle} />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px",
              background: "#2563E8", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Check size={12} /> Speichern
            </button>
            <button onClick={() => { setAdding(false); setForm({ month: currentMonth(), amount: "", category: "SERVER", note: "" }); }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
              background: "transparent", border: "1px solid #1E3050", borderRadius: 6, color: "#7A8BA6", fontSize: 12, cursor: "pointer" }}>
              <X size={12} /> Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Cost list grouped by month */}
      {grouped.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#7A8BA6" }}>
          <p style={{ fontSize: 13 }}>Noch keine Kosten erfasst.</p>
          <p style={{ fontSize: 11, marginTop: 4 }}>Klicke „Kosten hinzufügen" um zu starten.</p>
        </div>
      )}

      {grouped.map(([month, entries]) => {
        const monthTotal = entries.reduce((s, c) => s + c.amount, 0);
        return (
          <div key={month}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "#7A8BA6", letterSpacing: ".08em", textTransform: "uppercase", margin: 0 }}>
                {formatMonth(month)}
              </h3>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#EDF2F7", fontVariantNumeric: "tabular-nums" }}>
                {formatEur(monthTotal)}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {entries.map((cost) => {
                const cat = catMeta(cost.category);
                const isEditing = editId === cost.id;
                return (
                  <EditableRow
                    key={cost.id}
                    cost={cost}
                    cat={cat}
                    isEditing={isEditing}
                    onEdit={() => setEditId(cost.id)}
                    onCancel={() => setEditId(null)}
                    onSave={(patch) => update(cost.id, patch)}
                    onDelete={() => remove(cost.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Editable row ──────────────────────────────

function EditableRow({ cost, cat, isEditing, onEdit, onCancel, onSave, onDelete }: {
  cost: AppCost;
  cat: { value: string; label: string; color: string };
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: Partial<AppCost>) => void;
  onDelete: () => void;
}) {
  const [amount, setAmount] = useState(String(cost.amount));
  const [category, setCategory] = useState(cost.category);
  const [note, setNote] = useState(cost.note ?? "");

  if (isEditing) {
    return (
      <div style={{ background: "#0F1825", border: "1px solid #2563E8", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input type="number" step="0.01" min="0" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ ...inputStyle, width: 90 }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, width: 120 }}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input type="text" placeholder="Notiz" value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onSave({ amount: parseFloat(amount), category: category as AppCost["category"], note: note || null })}
            style={actionBtn("#2563E8")}><Check size={12} /></button>
          <button onClick={onCancel} style={actionBtn("#1E3050")}><X size={12} /></button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#0F1825", border: "1px solid #1E3050", borderRadius: 8,
      padding: "10px 12px", display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: cat.color, fontWeight: 600, width: 70, flexShrink: 0 }}>{cat.label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#EDF2F7", fontVariantNumeric: "tabular-nums", width: 80 }}>
        {Number(cost.amount).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
      </span>
      {cost.note && <span style={{ fontSize: 11, color: "#7A8BA6", flex: 1 }}>{cost.note}</span>}
      {!cost.note && <span style={{ flex: 1 }} />}
      <div style={{ display: "flex", gap: 6, opacity: 0 }} className="row-actions"
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}>
        <button onClick={onEdit} style={actionBtn("#1E3050")}><Pencil size={11} /></button>
        <button onClick={onDelete} style={actionBtn("#1E3050", "#EF4444")}><Trash2 size={11} /></button>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────

const inputStyle: React.CSSProperties = {
  display: "block",
  marginTop: 4,
  width: "100%",
  background: "#0B1220",
  border: "1px solid #1E3050",
  borderRadius: 6,
  color: "#EDF2F7",
  fontSize: 12,
  padding: "6px 10px",
  outline: "none",
  boxSizing: "border-box",
};

function actionBtn(bg: string, color = "#7A8BA6"): React.CSSProperties {
  return {
    width: 26, height: 26, borderRadius: 5, background: bg,
    border: "1px solid #1E3050", color, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
}
