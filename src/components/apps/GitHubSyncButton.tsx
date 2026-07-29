"use client";

import { useState } from "react";
import { GitBranch, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";

type SyncResult = {
  imported: number;
  skipped: number;
  releasesFound: number;
  tagsFound: number;
  isPrivate: boolean;
  repo: string;
};

export function GitHubSyncButton({ appSlug }: { appSlug: string }) {
  const [state, setState] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [result, setResult] = useState<SyncResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function sync() {
    setState("syncing");
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/apps/${appSlug}/github-sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Unbekannter Fehler");
        setState("error");
        return;
      }
      setResult(data);
      setState("success");
      setTimeout(() => setState("idle"), 6000);
    } catch {
      setErrorMsg("Netzwerkfehler");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Button — immer sichtbar */}
      <button
        onClick={sync}
        disabled={state === "syncing"}
        title="Releases & Changelog von GitHub synchronisieren"
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "6px 12px",
          background: state === "success" ? "rgba(16,185,129,0.12)" : "#1A2640",
          color: state === "success" ? "#10B981" : "#EDF2F7",
          border: `1px solid ${state === "success" ? "rgba(16,185,129,0.3)" : state === "error" ? "rgba(239,68,68,0.4)" : "#1E3050"}`,
          borderRadius: 7, fontSize: 11,
          cursor: state === "syncing" ? "not-allowed" : "pointer",
          opacity: state === "syncing" ? 0.7 : 1,
          transition: "background 200ms, color 200ms, border-color 200ms",
        }}>
        {state === "syncing" ? <Loader2 size={11} className="animate-spin" /> : <GitBranch size={11} />}
        {state === "syncing" ? "Synchronisiere…" : state === "success" ? "Synchronisiert" : "GitHub Sync"}
      </button>

      {/* Erfolgs-Hinweis — Tooltip unter dem Button */}
      {state === "success" && result && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "#0B1220", border: "1px solid rgba(16,185,129,0.35)",
          borderRadius: 8, padding: "7px 10px",
          display: "flex", alignItems: "center", gap: 7,
          whiteSpace: "nowrap", zIndex: 50,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          fontSize: 11, color: "#10B981",
        }}>
          <CheckCircle size={11} />
          <span>
            {result.imported > 0
              ? `${result.imported} Release${result.imported > 1 ? "s" : ""} importiert`
              : "Bereits aktuell"}
            {result.isPrivate && " · Privat-Tag gesetzt"}
          </span>
        </div>
      )}

      {/* Fehler-Hinweis — Tooltip unter dem Button */}
      {state === "error" && errorMsg && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "#0B1220", border: "1px solid rgba(239,68,68,0.35)",
          borderRadius: 8, padding: "7px 10px",
          display: "flex", alignItems: "flex-start", gap: 7,
          zIndex: 50, maxWidth: 340,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          fontSize: 11, color: "#F87171",
        }}>
          <AlertCircle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ lineHeight: 1.4 }}>{errorMsg}</span>
          <button
            onClick={() => setState("idle")}
            style={{ background: "none", border: "none", color: "#F87171", cursor: "pointer", padding: 0, marginLeft: 4, flexShrink: 0 }}>
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
