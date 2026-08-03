"use client";

import type { HealthScoreResult } from "@/lib/healthScore";
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function HealthScoreWidget({ score }: { score: HealthScoreResult }) {
  const [expanded, setExpanded] = useState(false);
  const { total, grade, color, criteria } = score;

  // SVG-Ring
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (total / 100) * circ;

  return (
    <div style={{ background: "#0B1220", border: "1px solid #1A2640", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header-Zeile */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Ring-Gauge */}
        <svg width={88} height={88} viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
          <circle cx={44} cy={44} r={r} fill="none" stroke="#1A2640" strokeWidth={8} />
          <circle
            cx={44} cy={44} r={r}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform="rotate(-90 44 44)"
            style={{ transition: "stroke-dasharray 600ms ease" }}
          />
          <text x={44} y={40} textAnchor="middle" fill={color} fontSize={18} fontWeight={700} fontFamily="system-ui">{total}</text>
          <text x={44} y={54} textAnchor="middle" fill="#4A5B6F" fontSize={10} fontFamily="system-ui">/ 100</text>
        </svg>

        {/* Score-Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#EDF2F7" }}>Health Score</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 99, color, background: `${color}18`, border: `1px solid ${color}44` }}>
              {grade}
            </span>
          </div>
          <p style={{ fontSize: 11, color: "#7A8BA6", margin: "0 0 8px", lineHeight: 1.5 }}>
            {total >= 90 ? "Exzellenter Pflegestatus — alles aktuell." :
             total >= 70 ? "Guter Stand — kleine Lücken verbesserungsfähig." :
             total >= 50 ? "Mäßig — mehrere Kriterien offen." :
                           "Handlungsbedarf — wichtige Qualitätspunkte fehlen."}
          </p>
          {/* Mini-Balken je Kriterium */}
          <div style={{ display: "flex", gap: 3 }}>
            {criteria.map((c) => (
              <div key={c.key} title={`${c.label}: ${c.passed ? "✓" : "✗"}`}
                style={{ flex: 1, height: 4, borderRadius: 2, background: c.passed ? color : "#1A2640" }} />
            ))}
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)}
          style={{ background: "none", border: "none", color: "#4A5B6F", cursor: "pointer", padding: 4, display: "flex" }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Kriterien-Liste */}
      {expanded && (
        <div style={{ borderTop: "1px solid #1A2640", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {criteria.map((c) => (
            <div key={c.key} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              {c.passed
                ? <CheckCircle size={14} style={{ color: "#10B981", flexShrink: 0, marginTop: 1 }} />
                : <XCircle    size={14} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, color: c.passed ? "#EDF2F7" : "#7A8BA6" }}>{c.label}</span>
                {!c.passed && c.hint && (
                  <p style={{ fontSize: 11, color: "#4A5B6F", margin: "1px 0 0" }}>{c.hint}</p>
                )}
              </div>
              <span style={{ fontSize: 11, color: c.passed ? color : "#2A3850", fontWeight: 600, whiteSpace: "nowrap" }}>
                +{c.points} Pkt.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
