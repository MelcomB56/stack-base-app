"use client";

import { useState } from "react";
import { Shield, X, ChevronRight, ChevronLeft, Check, AlertTriangle, Info } from "lucide-react";

interface Question {
  id: string;
  category: string;
  text: string;
  hint: string;
  weight: number;      // max Punkte für diese Frage
  naOption?: boolean;  // "Nicht zutreffend" erlaubt?
}

const QUESTIONS: Question[] = [
  {
    id: "auth",
    category: "Authentifizierung",
    text: "Gibt es eine Benutzer-Authentifizierung (Login, API-Keys, Token)?",
    hint: "Anwendungen ohne Authentifizierung sollten nicht öffentlich erreichbar sein.",
    weight: 15,
  },
  {
    id: "https",
    category: "Transport-Sicherheit",
    text: "Wird HTTPS durchgängig erzwungen (kein HTTP-Fallback)?",
    hint: "HTTP-Weiterleitungen auf HTTPS reichen; wichtig ist, dass kein Inhalt unverschlüsselt übertragen wird.",
    weight: 10,
    naOption: true,
  },
  {
    id: "secrets",
    category: "Secrets-Management",
    text: "Werden Passwörter, API-Keys und Tokens sicher verwaltet (kein Hardcoding, .env / Vault)?",
    hint: "Secrets sollten niemals im Quellcode oder in der Versionskontrolle liegen.",
    weight: 15,
  },
  {
    id: "input",
    category: "Input-Validierung",
    text: "Werden alle Benutzereingaben validiert und sanitized (SQL-Injection, XSS)?",
    hint: "Besonders wichtig bei Datenbankabfragen, Datei-Uploads und HTML-Ausgabe.",
    weight: 15,
  },
  {
    id: "ratelimit",
    category: "Rate-Limiting",
    text: "Gibt es Schutz gegen Brute-Force und übermäßige Anfragen (Rate-Limiting)?",
    hint: "Gilt vor allem für Login-Endpunkte und öffentliche APIs.",
    weight: 10,
    naOption: true,
  },
  {
    id: "deps",
    category: "Abhängigkeiten",
    text: "Werden Paket-Abhängigkeiten regelmäßig auf bekannte Schwachstellen geprüft (npm audit, Dependabot)?",
    hint: "Veraltete Pakete sind eine der häufigsten Angriffsvektoren.",
    weight: 10,
  },
  {
    id: "cors",
    category: "CORS / Header",
    text: "Sind CORS-Richtlinien korrekt konfiguriert (kein Wildcard * bei authentifizierten Endpunkten)?",
    hint: "Sicherheits-Header wie CSP, X-Frame-Options und HSTS sind ein Plus.",
    weight: 10,
    naOption: true,
  },
  {
    id: "logging",
    category: "Logging & Monitoring",
    text: "Werden sicherheitsrelevante Ereignisse geloggt (Login-Fehler, Zugriffsfehler, Exceptions)?",
    hint: "Logs helfen, Angriffe zu erkennen — aber niemals Passwörter oder Tokens loggen.",
    weight: 10,
  },
  {
    id: "backup",
    category: "Datensicherung",
    text: "Gibt es regelmäßige, getestete Backups der Anwendungsdaten?",
    hint: "Backups sollten isoliert gespeichert und gelegentlich auf Wiederherstellbarkeit getestet werden.",
    weight: 10,
    naOption: true,
  },
  {
    id: "permissions",
    category: "Minimale Rechte",
    text: "Gilt das Prinzip der minimalen Rechte (DB-User, API-Tokens, Prozess-User)?",
    hint: "Kein root-Betrieb, kein DB-Admin-Account für die Anwendung, keine übermäßigen Berechtigungen.",
    weight: 5,
  },
];

type Answer = "yes" | "partial" | "no" | "na";

const ANSWER_OPTIONS: { value: Answer; label: string; points: (w: number) => number; color: string }[] = [
  { value: "yes",     label: "Ja, vollständig",    points: (w) => w,          color: "#10B981" },
  { value: "partial", label: "Teilweise / geplant", points: (w) => Math.round(w * 0.5), color: "#F59E0B" },
  { value: "no",      label: "Nein",               points: (_) => 0,          color: "#EF4444" },
  { value: "na",      label: "Nicht zutreffend",   points: (w) => w,          color: "#7A8BA6" },
];

function gradeColor(score: number) {
  if (score >= 90) return "#10B981";
  if (score >= 70) return "#F59E0B";
  if (score >= 50) return "#F97316";
  return "#EF4444";
}
function gradeLabel(score: number) {
  if (score >= 90) return { grade: "A", text: "Sehr sicher" };
  if (score >= 70) return { grade: "B", text: "Gut aufgestellt" };
  if (score >= 50) return { grade: "C", text: "Verbesserungsbedarf" };
  return { grade: "D", text: "Handlungsbedarf" };
}

export function SecurityWizard({ onComplete }: { onComplete: (score: number) => void }) {
  const [open, setOpen]         = useState(false);
  const [step, setStep]         = useState(0);          // 0 = Intro, 1..N = Fragen, N+1 = Ergebnis
  const [answers, setAnswers]   = useState<Record<string, Answer>>({});

  const totalSteps = QUESTIONS.length;
  const isIntro    = step === 0;
  const isResult   = step === totalSteps + 1;
  const q          = !isIntro && !isResult ? QUESTIONS[step - 1] : null;

  function calcScore() {
    const totalWeight = QUESTIONS.reduce((s, q) => s + q.weight, 0);
    let earned = 0;
    QUESTIONS.forEach((q) => {
      const a = answers[q.id] ?? "no";
      const opt = ANSWER_OPTIONS.find((o) => o.value === a)!;
      earned += opt.points(q.weight);
    });
    return Math.round((earned / totalWeight) * 100);
  }

  function open_() {
    setOpen(true);
    setStep(0);
    setAnswers({});
  }

  function close() {
    setOpen(false);
  }

  function next() {
    if (isIntro) { setStep(1); return; }
    if (step === totalSteps) { setStep(totalSteps + 1); return; }
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function adopt() {
    onComplete(calcScore());
    setOpen(false);
  }

  const currentAnswer = q ? answers[q.id] : undefined;
  const canNext = isIntro || isResult || currentAnswer !== undefined;
  const score = isResult ? calcScore() : 0;
  const { grade, text } = isResult ? gradeLabel(score) : { grade: "", text: "" };
  const color = isResult ? gradeColor(score) : "#2563E8";

  if (!open) {
    return (
      <button
        type="button"
        onClick={open_}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
          background: "transparent", border: "1px solid #2563E840",
          color: "#2563E8", cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        <Shield size={12} /> Wizard
      </button>
    );
  }

  // ── Overlay ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(4,10,20,0.75)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#0B1220", border: "1px solid #1E3050", borderRadius: 14,
        width: "100%", maxWidth: 560, display: "flex", flexDirection: "column",
        maxHeight: "90vh", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E3050", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={16} style={{ color: "#2563E8" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#EDF2F7" }}>Sicherheitsbewertung</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!isIntro && !isResult && (
              <span style={{ fontSize: 11, color: "#7A8BA6" }}>{step} / {totalSteps}</span>
            )}
            <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "#4A5B6F", display: "flex", padding: 2 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Fortschrittsbalken */}
        {!isIntro && !isResult && (
          <div style={{ height: 3, background: "#1A2640" }}>
            <div style={{ height: "100%", background: "#2563E8", width: `${(step / totalSteps) * 100}%`, transition: "width 300ms ease" }} />
          </div>
        )}

        {/* Inhalt */}
        <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>

          {/* Intro */}
          {isIntro && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(37,99,232,0.12)", border: "1px solid rgba(37,99,232,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Shield size={24} style={{ color: "#2563E8" }} />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#EDF2F7", margin: "0 0 8px" }}>Sicherheitsbewertung durchführen</h2>
                <p style={{ fontSize: 13, color: "#7A8BA6", margin: 0, lineHeight: 1.6 }}>
                  Dieser Wizard stellt dir {totalSteps} gezielte Fragen zu deiner App und berechnet daraus automatisch einen Sicherheitsscore (0–100).
                </p>
              </div>
              <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Authentifizierung & Autorisierung",
                  "Transport-Sicherheit (HTTPS)",
                  "Secrets & Konfiguration",
                  "Input-Validierung & Abhängigkeiten",
                  "Logging, Backup & Zugriffsrechte",
                ].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#C8D8EC" }}>
                    <Check size={11} style={{ color: "#2563E8", flexShrink: 0 }} />
                    {t}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#4A5B6F", margin: 0 }}>
                Du kannst jederzeit zurückgehen und Antworten ändern. Die Bewertung ist eine Hilfestellung — kein Sicherheits-Audit.
              </p>
            </div>
          )}

          {/* Frage */}
          {q && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#2563E8" }}>
                  {q.category}
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#EDF2F7", margin: "6px 0 0", lineHeight: 1.4 }}>{q.text}</h3>
              </div>

              <div style={{ background: "#111C2D", border: "1px solid #1A2640", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                <Info size={12} style={{ color: "#4A5B6F", marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: "#4A5B6F", margin: 0, lineHeight: 1.5 }}>{q.hint}</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ANSWER_OPTIONS.filter((o) => o.value !== "na" || q.naOption).map((opt) => {
                  const selected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt.value }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                        background: selected ? `${opt.color}12` : "#111C2D",
                        border: `1px solid ${selected ? opt.color + "66" : "#1E3050"}`,
                        transition: "all 150ms",
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", border: `2px solid ${selected ? opt.color : "#2A3850"}`,
                        background: selected ? opt.color : "transparent", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: selected ? 500 : 400, color: selected ? opt.color : "#7A8BA6" }}>
                        {opt.label}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#4A5B6F" }}>
                        {opt.points(q.weight)} / {q.weight} Pkt.
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ergebnis */}
          {isResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                <div style={{ fontSize: 48, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{score}</div>
                <div style={{ fontSize: 12, color: "#7A8BA6", marginBottom: 10 }}>von 100 Punkten</div>
                <span style={{ fontSize: 13, fontWeight: 700, padding: "3px 14px", borderRadius: 99, color, background: `${color}18`, border: `1px solid ${color}44` }}>
                  {grade} — {text}
                </span>
              </div>

              {/* Aufschlüsselung */}
              <div style={{ background: "#111C2D", border: "1px solid #1E3050", borderRadius: 10, overflow: "hidden" }}>
                {QUESTIONS.map((q, i) => {
                  const a = answers[q.id] ?? "no";
                  const opt = ANSWER_OPTIONS.find((o) => o.value === a)!;
                  const pts = opt.points(q.weight);
                  const isGood = pts === q.weight;
                  const isPartial = pts > 0 && pts < q.weight;
                  return (
                    <div key={q.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
                      borderBottom: i < QUESTIONS.length - 1 ? "1px solid #1A2640" : "none",
                    }}>
                      {isGood    && <Check size={13}         style={{ color: "#10B981", flexShrink: 0 }} />}
                      {isPartial && <AlertTriangle size={13} style={{ color: "#F59E0B", flexShrink: 0 }} />}
                      {!isGood && !isPartial && <X size={13} style={{ color: "#EF4444", flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, color: isGood ? "#EDF2F7" : "#7A8BA6" }}>{q.category}</span>
                      </div>
                      <span style={{ fontSize: 11, color: isGood ? "#10B981" : isPartial ? "#F59E0B" : "#EF4444", fontWeight: 600 }}>
                        {pts} / {q.weight}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #1E3050", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={back}
            disabled={isIntro}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: "transparent", border: "1px solid #1E3050", color: "#7A8BA6",
              cursor: isIntro ? "not-allowed" : "pointer", opacity: isIntro ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={13} /> Zurück
          </button>

          {isResult ? (
            <button
              type="button"
              onClick={adopt}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 18px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: color, border: "none", color: "#fff", cursor: "pointer",
              }}
            >
              <Check size={13} /> Score übernehmen ({score})
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={!canNext}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 18px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: canNext ? "#2563E8" : "#1A2640", border: "none",
                color: canNext ? "#fff" : "#4A5B6F", cursor: canNext ? "pointer" : "not-allowed",
              }}
            >
              {isIntro ? "Starten" : step === totalSteps ? "Auswertung" : "Weiter"}
              {!isIntro && <ChevronRight size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
